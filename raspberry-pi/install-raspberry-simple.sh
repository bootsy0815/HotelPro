#!/bin/bash

# HotelPro - Vereinfachtes Installations-Script für Raspberry Pi
# Verwendet Docker für MongoDB (einfacher als native Installation)

set -e

echo "=========================================="
echo "HotelPro Raspberry Pi Installation"
echo "Vereinfachte Version mit Docker MongoDB"
echo "=========================================="
echo ""

# Prüfen ob als root
if [ "$EUID" -ne 0 ]; then 
   echo "Bitte als root ausführen: sudo ./install-raspberry-simple.sh"
   exit 1
fi

# Aktuelles Verzeichnis als APP_DIR verwenden
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
USER_HOME="/home/pi"

echo "Installation von: $APP_DIR"
echo ""

# Prüfen ob backend und frontend Ordner existieren
if [ ! -d "$APP_DIR/backend" ]; then
    echo "FEHLER: backend Ordner nicht gefunden in $APP_DIR"
    echo "Bitte stellen Sie sicher, dass Sie das Script vom hotelpro-Verzeichnis aus ausführen"
    exit 1
fi

if [ ! -d "$APP_DIR/frontend" ]; then
    echo "FEHLER: frontend Ordner nicht gefunden in $APP_DIR"
    exit 1
fi

echo "✓ Code-Verzeichnisse gefunden"
echo ""

echo "Schritt 1/8: System aktualisieren..."
apt update && apt upgrade -y

echo "Schritt 2/8: Node.js installieren..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    npm install -g yarn
fi
echo "✓ Node.js $(node --version) installiert"

echo "Schritt 3/8: Python vorbereiten..."
apt-get install -y python3 python3-pip python3-venv
echo "✓ Python $(python3 --version) installiert"

echo "Schritt 4/8: Docker installieren (für MongoDB)..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker pi
    apt-get install -y docker-compose-plugin
fi
echo "✓ Docker installiert"

echo "Schritt 5/8: MongoDB Container starten..."
docker run -d \
  --name hotelpro-mongodb \
  --restart always \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:6.0

echo "Warte 10 Sekunden auf MongoDB-Start..."
sleep 10
echo "✓ MongoDB Container läuft"

echo "Schritt 6/8: Nginx installieren..."
apt-get install -y nginx
echo "✓ Nginx installiert"

echo "Schritt 7/8: Backend einrichten..."
cd "$APP_DIR/backend"
sudo -u pi python3 -m venv venv
sudo -u pi bash -c "source venv/bin/activate && pip install -r requirements.txt"
echo "✓ Backend Dependencies installiert"

echo "Schritt 8/8: Frontend bauen..."
cd "$APP_DIR/frontend"

# .env Datei erstellen mit korrekter Backend-URL
PI_IP=$(hostname -I | awk '{print $1}')
echo "REACT_APP_BACKEND_URL=http://${PI_IP}:8001" > .env

sudo -u pi yarn install
sudo -u pi bash -c "GENERATE_SOURCEMAP=false yarn build"
echo "✓ Frontend gebaut"

echo "Schritt 9/8: Systemd Service erstellen..."
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

echo "Schritt 10/8: Nginx konfigurieren..."
cat > /etc/nginx/sites-available/hotelpro <<EOF
server {
    listen 80;
    server_name _;

    location / {
        root $APP_DIR/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/hotelpro /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

echo "Schritt 11/8: Services starten..."
systemctl daemon-reload
systemctl enable hotelpro-backend
systemctl start hotelpro-backend
systemctl restart nginx

echo ""
echo "=========================================="
echo "✓✓✓ Installation erfolgreich! ✓✓✓"
echo "=========================================="
echo ""
echo "HotelPro läuft jetzt auf:"
echo "  http://$(hostname -I | awk '{print $1}')"
echo "  http://$(hostname).local"
echo ""
echo "MongoDB läuft als Docker Container:"
echo "  docker ps"
echo ""
echo "Services:"
echo "  Backend: systemctl status hotelpro-backend"
echo "  Nginx:   systemctl status nginx"
echo "  MongoDB: docker ps | grep mongodb"
echo ""
echo "Logs anzeigen:"
echo "  sudo journalctl -u hotelpro-backend -f"
echo "  docker logs hotelpro-mongodb -f"
echo ""
