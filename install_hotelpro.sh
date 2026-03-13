#!/bin/bash

# Farben für die Optik
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}   HotelPro Full-Stack Installer & Validator    ${NC}"
echo -e "${BLUE}===============================================${NC}"

# 1. Update & Basis-Pakete
echo -e "${GREEN}[1/7] System-Update und Basis-Tools...${NC}"
apt-get update && apt-get upgrade -y
apt-get install -y curl git python3 python3-pip python3-venv nginx gnupg build-essential

# 2. MongoDB Installation (Plattform-autark)
echo -e "${GREEN}[2/7] Datenbank (MongoDB) wird eingerichtet...${NC}"
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    if [[ $(uname -m) == "aarch64" ]]; then
        echo "deb [arch=arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
    else
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
    fi
    apt-get update && apt-get install -y mongodb-org
fi
systemctl enable --now mongod

# 3. Node.js & Frontend Build
echo -e "${GREEN}[3/7] Frontend-Build vorbereiten...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
cd /var/www/hotelpro/frontend
npm install
npm run build

# 4. Backend-Abhängigkeiten
echo -e "${GREEN}[4/7] Python-Backend konfigurieren...${NC}"
pip3 install fastapi uvicorn motor starlette --break-system-packages

# 5. Systemd-Service für Backend-Autostart
echo -e "${GREEN}[5/7] Backend Autostart-Dienst erstellen...${NC}"
cat <<EOF > /etc/systemd/system/hotelpro-backend.service
[Unit]
Description=HotelPro Backend Service
After=mongodb.service network.target

[Service]
User=root
WorkingDirectory=/var/www
