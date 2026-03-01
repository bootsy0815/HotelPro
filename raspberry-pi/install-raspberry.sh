#!/bin/bash

# HotelPro - Automatisches Installations-Script für Raspberry Pi
# Ausführen mit: sudo ./install-raspberry.sh

set -e  # Bei Fehler abbrechen

echo "=========================================="
echo "HotelPro Raspberry Pi Installation"
echo "=========================================="
echo ""

# Prüfen ob als root
if [ "$EUID" -ne 0 ]; then 
   echo "Bitte als root ausführen: sudo ./install-raspberry.sh"
   exit 1
fi

USER_HOME="/home/pi"
APP_DIR="$USER_HOME/hotelpro"

echo "Schritt 1/10: System aktualisieren..."
apt update && apt upgrade -y

echo "Schritt 2/10: Node.js installieren..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    npm install -g yarn
fi
echo "✓ Node.js $(node --version) installiert"

echo "Schritt 3/10: Python vorbereiten..."
apt-get install -y python3 python3-pip python3-venv
echo "✓ Python $(python3 --version) installiert"

echo "Schritt 4/10: MongoDB installieren..."
if ! command -v mongod &> /dev/null; then
    # Moderne Methode für GPG-Keys (apt-key ist deprecated)
    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg
    
    # Repository mit signed-by hinzufügen
    echo "deb [ arch=arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    
    apt-get update
    apt-get install -y mongodb-org
    
    # MongoDB starten
    systemctl start mongod
    systemctl enable mongod
    
    echo "✓ MongoDB installiert"
else
    echo "✓ MongoDB bereits installiert"
fi

echo "Schritt 5/10: Nginx installieren..."
apt-get install -y nginx
echo "✓ Nginx installiert"

echo "Schritt 6/10: Backend einrichten..."
cd "$APP_DIR/backend"
sudo -u pi python3 -m venv venv
sudo -u pi bash -c "source venv/bin/activate && pip install -r requirements.txt"
echo "✓ Backend Dependencies installiert"

echo "Schritt 7/10: Frontend bauen..."
cd "$APP_DIR/frontend"
sudo -u pi yarn install
sudo -u pi bash -c "GENERATE_SOURCEMAP=false yarn build"
echo "✓ Frontend gebaut"

echo "Schritt 8/10: Systemd Service erstellen..."
cat > /etc/systemd/system/hotelpro-backend.service <<EOF
[Unit]
Description=HotelPro Backend Service
After=network.target mongod.service

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

echo "Schritt 9/10: Nginx konfigurieren..."
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

echo "Schritt 10/10: Services starten..."
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
echo "Services:"
echo "  Backend: systemctl status hotelpro-backend"
echo "  Nginx:   systemctl status nginx"
echo "  MongoDB: systemctl status mongod"
echo ""
echo "Logs anzeigen:"
echo "  sudo journalctl -u hotelpro-backend -f"
echo ""
