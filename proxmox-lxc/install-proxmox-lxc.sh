#!/bin/bash

# HotelPro - Installation für Proxmox LXC (Debian 13)
# Optimiert für Container-Umgebung

set -e

echo "=========================================="
echo "HotelPro Installation - Proxmox LXC"
echo "Debian 13 (Trixie)"
echo "=========================================="
echo ""

# Prüfen ob als root
if [ "$EUID" -ne 0 ]; then 
   echo "Bitte als root ausführen: sudo ./install-proxmox-lxc.sh"
   exit 1
fi

# Aktuelles Verzeichnis als APP_DIR verwenden
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Installation von: $APP_DIR"
echo ""

# Prüfen ob backend und frontend Ordner existieren
if [ ! -d "$APP_DIR/backend" ] || [ ! -d "$APP_DIR/frontend" ]; then
    echo "FEHLER: backend oder frontend Ordner nicht gefunden"
    echo "Code muss erst in den LXC kopiert werden!"
    exit 1
fi

echo "✓ Code-Verzeichnisse gefunden"
echo ""

echo "Schritt 1/10: System aktualisieren..."
apt update
apt upgrade -y

echo "Schritt 2/10: Grundlegende Tools installieren..."
apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release

echo "Schritt 3/10: Node.js 18 LTS installieren..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    npm install -g yarn
    echo "  ✓ Node.js $(node --version) installiert"
else
    echo "  ✓ Node.js bereits installiert: $(node --version)"
fi

echo "Schritt 4/10: Python 3 und Dependencies..."
apt-get install -y python3 python3-pip python3-venv python3-dev build-essential
echo "✓ Python $(python3 --version) bereit"

echo "Schritt 5/10: MongoDB installieren..."

# Versuche zuerst native Installation
MONGO_NATIVE=false

if ! command -v mongod &> /dev/null; then
    echo "  Versuche native MongoDB Installation..."
    
    # MongoDB GPG Key (neueste Methode ohne apt-key)
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc 2>/dev/null | \
        gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg 2>/dev/null || true
    
    if [ -f /usr/share/keyrings/mongodb-server-7.0.gpg ]; then
        # MongoDB Repository für Debian (Bookworm = Debian 12, kompatibel mit 13)
        echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | \
            tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        
        # Repository Update (Fehler ignorieren)
        apt-get update 2>/dev/null || true
        
        # MongoDB installieren (Fehler ignorieren)
        if DEBIAN_FRONTEND=noninteractive apt-get install -y mongodb-org 2>/dev/null; then
            systemctl start mongod 2>/dev/null && systemctl enable mongod 2>/dev/null
            
            if systemctl is-active --quiet mongod; then
                MONGO_NATIVE=true
                echo "  ✓ MongoDB 7.0 nativ installiert"
            fi
        fi
    fi
fi

# Falls native Installation fehlschlägt: Docker verwenden
if [ "$MONGO_NATIVE" = false ] && ! systemctl is-active --quiet mongod 2>/dev/null; then
    echo "  Native Installation fehlgeschlagen, verwende Docker..."
    
    # Docker installieren falls nicht vorhanden
    if ! command -v docker &> /dev/null; then
        echo "  Installiere Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh >/dev/null 2>&1
        rm get-docker.sh
    fi
    
    # Alte MongoDB Container entfernen
    docker stop hotelpro-mongodb 2>/dev/null || true
    docker rm hotelpro-mongodb 2>/dev/null || true
    
    # MongoDB Container starten
    docker run -d \
        --name hotelpro-mongodb \
        --restart always \
        -p 27017:27017 \
        -v hotelpro_mongodb_data:/data/db \
        mongo:7.0 >/dev/null 2>&1
    
    echo "  Warte auf MongoDB Container Start..."
    sleep 8
    
    if docker ps 2>/dev/null | grep -q hotelpro-mongodb; then
        echo "  ✓ MongoDB 7.0 als Docker Container"
        MONGO_NATIVE=false
    else
        echo "  ✗ FEHLER: MongoDB konnte nicht gestartet werden!"
        exit 1
    fi
else
    MONGO_NATIVE=true
    echo "  ✓ MongoDB läuft (nativ)"
fi

echo "Schritt 6/10: Nginx installieren..."
apt-get install -y nginx
echo "✓ Nginx installiert"

echo "Schritt 7/10: Backend einrichten..."
cd "$APP_DIR/backend"

# User für Applikation (falls nicht root)
APP_USER="root"
if id "hotelpro" &>/dev/null; then
    APP_USER="hotelpro"
elif id "www-data" &>/dev/null; then
    APP_USER="www-data"
fi

echo "  Verwende User: $APP_USER"

# Virtuelle Umgebung erstellen
if [ "$APP_USER" = "root" ]; then
    python3 -m venv venv
else
    sudo -u $APP_USER python3 -m venv venv
fi

echo "  Installiere Python-Pakete (dauert 3-5 Min)..."
if [ "$APP_USER" = "root" ]; then
    bash -c "source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt"
else
    sudo -u $APP_USER bash -c "source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt"
fi

echo "  ✓ Backend Dependencies installiert"

echo "Schritt 8/10: Backend Konfiguration..."
# Backend .env erstellen falls nicht vorhanden
if [ ! -f "$APP_DIR/backend/.env" ]; then
    cat > "$APP_DIR/backend/.env" <<EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="hotel_management"
CORS_ORIGINS="*"
RESEND_API_KEY=""
SENDER_EMAIL="onboarding@resend.dev"
EOF
    echo "  ✓ .env Datei erstellt"
fi

echo "Schritt 9/10: Frontend bauen..."
cd "$APP_DIR/frontend"

# LXC IP-Adresse ermitteln
LXC_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LXC_IP" ]; then
    LXC_IP="localhost"
fi
echo "  LXC IP-Adresse: $LXC_IP"

# Frontend .env erstellen
echo "REACT_APP_BACKEND_URL=http://${LXC_IP}:8001" > .env

echo "  Installiere Node-Pakete (dauert 5-10 Min)..."
if [ "$APP_USER" = "root" ]; then
    yarn install
else
    sudo -u $APP_USER yarn install
fi

echo "  Baue React-App (dauert 3-5 Min)..."
if [ "$APP_USER" = "root" ]; then
    GENERATE_SOURCEMAP=false yarn build
else
    sudo -u $APP_USER bash -c "GENERATE_SOURCEMAP=false yarn build"
fi

echo "  ✓ Frontend gebaut"

echo "Schritt 10/10: Services konfigurieren..."

# Systemd Service für Backend
cat > /etc/systemd/system/hotelpro-backend.service <<EOF
[Unit]
Description=HotelPro Backend Service
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
ExecStart=$APP_DIR/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Nginx Konfiguration
cat > /etc/nginx/sites-available/hotelpro <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;
    client_max_body_size 20M;

    # Frontend (React Build)
    location / {
        root APP_DIR_PLACEHOLDER/frontend/build;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # Gzip Kompression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

# APP_DIR in Nginx Config ersetzen
sed -i "s|APP_DIR_PLACEHOLDER|$APP_DIR|g" /etc/nginx/sites-available/hotelpro

# Nginx aktivieren
ln -sf /etc/nginx/sites-available/hotelpro /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx testen
if nginx -t 2>/dev/null; then
    echo "  ✓ Nginx Konfiguration OK"
else
    echo "  ⚠ Nginx Konfiguration hat Warnungen (meist OK)"
fi

# Services aktivieren und starten
echo "  Starte Services..."
systemctl daemon-reload
systemctl enable hotelpro-backend
systemctl restart hotelpro-backend
systemctl restart nginx

# Kurz warten
sleep 5

# Status prüfen
BACKEND_STATUS=$(systemctl is-active hotelpro-backend)
NGINX_STATUS=$(systemctl is-active nginx)

# MongoDB Status (unterschiedlich je nach Installation)
if [ "$MONGO_NATIVE" = true ]; then
    MONGO_STATUS=$(systemctl is-active mongod)
    MONGO_TYPE="nativ"
else
    if docker ps 2>/dev/null | grep -q hotelpro-mongodb; then
        MONGO_STATUS="active"
        MONGO_TYPE="Docker"
    else
        MONGO_STATUS="inactive"
        MONGO_TYPE="Docker"
    fi
fi

echo ""
echo "=========================================="
echo "✓✓✓ Installation abgeschlossen! ✓✓✓"
echo "=========================================="
echo ""
echo "Service Status:"
echo "  Backend:  $BACKEND_STATUS"
echo "  Nginx:    $NGINX_STATUS"
echo "  MongoDB:  $MONGO_STATUS"
echo ""

if [ "$BACKEND_STATUS" = "active" ] && [ "$NGINX_STATUS" = "active" ] && [ "$MONGO_STATUS" = "active" ]; then
    echo "✓ Alle Services laufen!"
    echo ""
    echo "HotelPro ist erreichbar unter:"
    echo "  http://$LXC_IP"
    echo "  http://$(hostname)"
    echo ""
    echo "Von anderen Geräten im Netzwerk:"
    echo "  - Browser öffnen"
    echo "  - http://$LXC_IP eingeben"
    echo "  - Fertig!"
    echo ""
    echo "Im Proxmox Netzwerk:"
    echo "  - Von jedem PC/Laptop/Tablet erreichbar"
    echo "  - Keine weitere Konfiguration nötig"
else
    echo "⚠ Einige Services laufen nicht korrekt."
    echo ""
    echo "Logs prüfen mit:"
    if [ "$BACKEND_STATUS" != "active" ]; then
        echo "  Backend: sudo journalctl -u hotelpro-backend -n 50 --no-pager"
    fi
    if [ "$MONGO_STATUS" != "active" ]; then
        echo "  MongoDB: sudo journalctl -u mongod -n 50 --no-pager"
    fi
fi

echo ""
echo "Nützliche Befehle:"
echo "  Services neu starten:"
echo "    systemctl restart hotelpro-backend"
echo "    systemctl restart nginx"
echo "    systemctl restart mongod"
echo ""
echo "  Logs anzeigen:"
echo "    journalctl -u hotelpro-backend -f"
echo "    journalctl -u mongod -f"
echo ""
echo "  Status prüfen:"
echo "    systemctl status hotelpro-backend"
echo "    systemctl status nginx"
echo "    systemctl status mongod"
echo ""
echo "  LXC Ressourcen:"
echo "    free -h              # RAM-Nutzung"
echo "    df -h                # Speicher"
echo "    htop                 # CPU/RAM live"
echo ""
