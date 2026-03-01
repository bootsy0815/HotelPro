#!/bin/bash

# HotelPro - Raspberry Pi Installation (Docker-Only für MongoDB)
# Überspringt native MongoDB-Installation, verwendet nur Docker

set -e

echo "=========================================="
echo "HotelPro Raspberry Pi Installation"
echo "MongoDB via Docker (keine APT-Probleme!)"
echo "=========================================="
echo ""

# Prüfen ob als root
if [ "$EUID" -ne 0 ]; then 
   echo "Bitte als root ausführen: sudo ./install-raspberry-docker.sh"
   exit 1
fi

# Aktuelles Verzeichnis als APP_DIR verwenden
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Installation von: $APP_DIR"
echo ""

# Prüfen ob backend und frontend Ordner existieren
if [ ! -d "$APP_DIR/backend" ] || [ ! -d "$APP_DIR/frontend" ]; then
    echo "FEHLER: backend oder frontend Ordner nicht gefunden in $APP_DIR"
    echo "Bitte Code erst auf Raspberry Pi kopieren!"
    exit 1
fi

echo "✓ Code-Verzeichnisse gefunden"
echo ""

echo "Schritt 1/9: System aktualisieren..."
apt update
# Upgrade optional überspringen für schnellere Installation
# apt upgrade -y

echo "Schritt 2/9: Node.js installieren..."
if ! command -v node &> /dev/null; then
    echo "  Node.js wird installiert..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    npm install -g yarn
    echo "  ✓ Node.js $(node --version) installiert"
else
    echo "  ✓ Node.js bereits installiert: $(node --version)"
fi

echo "Schritt 3/9: Python vorbereiten..."
apt-get install -y python3 python3-pip python3-venv python3-dev build-essential
echo "✓ Python $(python3 --version) bereit"

echo "Schritt 4/9: Docker installieren..."
if ! command -v docker &> /dev/null; then
    echo "  Docker wird installiert (dauert 2-3 Min)..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    usermod -aG docker pi
    echo "  ✓ Docker installiert"
else
    echo "  ✓ Docker bereits installiert"
fi

echo "Schritt 5/9: MongoDB Container starten..."
# Alte Container stoppen und entfernen
docker stop hotelpro-mongodb 2>/dev/null || true
docker rm hotelpro-mongodb 2>/dev/null || true

# Neuen Container starten
docker run -d \
  --name hotelpro-mongodb \
  --restart always \
  -p 27017:27017 \
  -v hotelpro_mongodb_data:/data/db \
  mongo:6.0

echo "  Warte 10 Sekunden auf MongoDB-Start..."
sleep 10

if docker ps | grep -q hotelpro-mongodb; then
    echo "  ✓ MongoDB Container läuft"
else
    echo "  ✗ FEHLER: MongoDB Container konnte nicht gestartet werden"
    docker logs hotelpro-mongodb
    exit 1
fi

echo "Schritt 6/9: Nginx installieren..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    echo "  ✓ Nginx installiert"
else
    echo "  ✓ Nginx bereits installiert"
fi

echo "Schritt 7/9: Backend einrichten..."
cd "$APP_DIR/backend"

# Besitzer auf pi setzen
chown -R pi:pi "$APP_DIR"

echo "  Erstelle virtuelle Python-Umgebung..."
sudo -u pi python3 -m venv venv

echo "  Installiere Python-Pakete (dauert 3-5 Min)..."
sudo -u pi bash -c "source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt"

echo "  ✓ Backend Dependencies installiert"

echo "Schritt 8/9: Frontend bauen..."
cd "$APP_DIR/frontend"

# IP-Adresse automatisch erkennen
PI_IP=$(hostname -I | awk '{print $1}')
echo "  Raspberry Pi IP: $PI_IP"

# Backend .env erstellen/prüfen
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo "  Erstelle backend/.env..."
    cat > "$APP_DIR/backend/.env" <<EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="hotel_management"
CORS_ORIGINS="*"
RESEND_API_KEY=""
SENDER_EMAIL="onboarding@resend.dev"
EOF
fi

# Frontend .env erstellen
echo "  Erstelle frontend/.env..."
echo "REACT_APP_BACKEND_URL=http://${PI_IP}:8001" > .env
chown pi:pi .env

echo "  Installiere Node-Pakete (dauert 5-10 Min)..."
sudo -u pi yarn install

echo "  Baue React-App (dauert 3-5 Min)..."
sudo -u pi bash -c "GENERATE_SOURCEMAP=false yarn build"

echo "  ✓ Frontend gebaut"

echo "Schritt 9/9: Services konfigurieren..."

# Systemd Service für Backend
cat > /etc/systemd/system/hotelpro-backend.service <<EOF
[Unit]
Description=HotelPro Backend Service
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=pi
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
ExecStart=$APP_DIR/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Nginx Konfiguration
cat > /etc/nginx/sites-available/hotelpro <<EOF
server {
    listen 80;
    server_name _;
    client_max_body_size 20M;

    # Frontend (React Build)
    location / {
        root $APP_DIR/frontend/build;
        try_files \$uri \$uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
    }
}
EOF

# Nginx aktivieren
ln -sf /etc/nginx/sites-available/hotelpro /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx testen
if nginx -t; then
    echo "  ✓ Nginx Konfiguration OK"
else
    echo "  ✗ Nginx Konfiguration fehlerhaft!"
    exit 1
fi

# Services starten
echo "  Starte Services..."
systemctl daemon-reload
systemctl enable hotelpro-backend
systemctl restart hotelpro-backend
systemctl restart nginx

# Kurz warten
sleep 3

# Status prüfen
BACKEND_STATUS=$(systemctl is-active hotelpro-backend)
NGINX_STATUS=$(systemctl is-active nginx)
MONGO_STATUS=$(docker inspect -f '{{.State.Running}}' hotelpro-mongodb 2>/dev/null || echo "false")

echo ""
echo "=========================================="
echo "✓✓✓ Installation abgeschlossen! ✓✓✓"
echo "=========================================="
echo ""
echo "Service Status:"
echo "  Backend: $BACKEND_STATUS"
echo "  Nginx:   $NGINX_STATUS"
echo "  MongoDB: $MONGO_STATUS"
echo ""

if [ "$BACKEND_STATUS" = "active" ] && [ "$NGINX_STATUS" = "active" ] && [ "$MONGO_STATUS" = "true" ]; then
    echo "✓ Alle Services laufen!"
    echo ""
    echo "HotelPro ist erreichbar unter:"
    echo "  http://$PI_IP"
    echo "  http://$(hostname).local"
    echo ""
    echo "Von anderen Geräten im Netzwerk:"
    echo "  - Browser öffnen"
    echo "  - http://$PI_IP eingeben"
    echo "  - Fertig!"
else
    echo "⚠ Einige Services laufen nicht korrekt."
    echo ""
    echo "Logs prüfen mit:"
    echo "  sudo journalctl -u hotelpro-backend -n 50"
    echo "  docker logs hotelpro-mongodb"
fi

echo ""
echo "Nützliche Befehle:"
echo "  Services neu starten:"
echo "    sudo systemctl restart hotelpro-backend"
echo "    sudo systemctl restart nginx"
echo "    docker restart hotelpro-mongodb"
echo ""
echo "  Logs anzeigen:"
echo "    sudo journalctl -u hotelpro-backend -f"
echo "    docker logs hotelpro-mongodb -f"
echo ""
echo "  Status prüfen:"
echo "    sudo systemctl status hotelpro-backend"
echo "    docker ps"
echo ""
