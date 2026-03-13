#!/bin/bash

# Farben für die Ausgabe
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== HotelPro Auto-Installer (V3 - Backend Folder Fix) ===${NC}"

# 1. System-Update & Basis-Pakete
echo -e "${GREEN}[1/6] Installiere System-Abhängigkeiten...${NC}"
apt-get update && apt-get install -y curl git python3 python3-pip python3-venv nginx gnupg build-essential

# 2. MongoDB Installation
if ! command -v mongod &> /dev/null; then
    echo -e "${GREEN}[2/6] Datenbank (MongoDB) wird eingerichtet...${NC}"
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    ARCH=$(uname -m)
    if [[ "$ARCH" == "aarch64" ]]; then
        echo "deb [arch=arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
    else
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
    fi
    apt-get update && apt-get install -y mongodb-org
fi
systemctl enable --now mongod

# 3. Frontend Build (Pfad: /var/www/hotelpro/frontend)
echo -e "${GREEN}[3/6] Frontend wird gebaut...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

cd /var/www/hotelpro/frontend
npm install --legacy-peer-deps
npm run build

# 4. Backend Einrichtung (Pfad: /var/www/hotelpro/backend)
echo -e "${GREEN}[4/6] Backend-Pakete werden installiert...${NC}"
pip3 install fastapi uvicorn motor starlette pymongo pydantic pydantic-settings --break-system-packages --ignore-installed typing-extensions

# 5. Autostart-Dienst (FIX: Zeigt jetzt auf den backend-Unterordner)
echo -e "${GREEN}[5/6] Konfiguriere Autostart-Dienst für /backend/server.py...${NC}"
cat << 'EOF' > /etc/systemd/system/hotelpro-backend.service
[Unit]
Description=HotelPro Backend
After=mongodb.service network.target

[Service]
User=root
WorkingDirectory=/var/www/hotelpro/backend
ExecStart=/usr/bin/python3 /var/www/hotelpro/backend/server.py
Restart=always
Environment=MONGO_URL=mongodb://localhost:27017

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now hotelpro-backend

# 6. Validierung
echo -e "${GREEN}[6/6] Überprüfe Installation...${NC}"
sleep 3
if systemctl is-active --quiet hotelpro-backend; then
    echo -e "${GREEN}✔ Backend läuft erfolgreich im Unterordner!${NC}"
else
    echo -e "${RED}✘ Backend-Start fehlgeschlagen. Prüfe 'journalctl -u hotelpro-backend'${NC}"
fi

echo -e "${BLUE}Installation mit Backend-Pfad-Fix abgeschlossen!${NC}"
