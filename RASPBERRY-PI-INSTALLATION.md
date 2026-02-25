# 🥧 HotelPro auf Raspberry Pi 4B - Installations-Anleitung

## 📋 Übersicht

Diese Anleitung zeigt Ihnen, wie Sie HotelPro auf einem Raspberry Pi 4B installieren, damit **mehrere Geräte gleichzeitig** im Netzwerk darauf zugreifen können.

**Perfekt für:**
- Hotels mit mehreren Arbeitsplätzen
- Zugriff von PC, Tablet, Smartphone
- 24/7 Betrieb
- Zentrale Datenhaltung

---

## 🖥️ Hardware-Anforderungen

### Raspberry Pi Setup:
- **Raspberry Pi 4B** (4GB RAM empfohlen, 2GB minimum)
- **32GB+ microSD-Karte** (Class 10 oder besser)
- **Netzteil** (offizielles 5V/3A empfohlen)
- **Netzwerk-Verbindung** (Ethernet empfohlen für Stabilität)
- Optional: Gehäuse mit Kühlung

### Client-Geräte:
- **PC/Laptop** - Windows, Mac, Linux
- **Tablets** - iPad, Android
- **Smartphones** - iOS, Android
- Alle Geräte müssen im **gleichen Netzwerk** sein

---

## 🚀 Schnellstart (Automatische Installation)

### Option A: Docker Installation (EMPFOHLEN)

Einfachste Methode - alles in einem Befehl:

```bash
# Docker und Docker Compose installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install -y docker-compose

# Code herunterladen
git clone https://github.com/IHR-USERNAME/hotelpro.git
cd hotelpro

# Starten
sudo docker-compose up -d
```

**Fertig!** App läuft auf: `http://raspberrypi.local:3000`

### Option B: Manuelle Installation

Falls Sie Docker nicht verwenden möchten:

```bash
# Installation-Script ausführen
cd hotelpro
sudo chmod +x raspberry-pi/install-raspberry.sh
sudo ./raspberry-pi/install-raspberry.sh
```

---

## 📝 Detaillierte Manuelle Installation

### Schritt 1: Raspberry Pi OS vorbereiten

1. **Raspberry Pi OS installieren:**
   - Download: https://www.raspberrypi.org/software/
   - Raspberry Pi Imager verwenden
   - "Raspberry Pi OS (64-bit)" empfohlen
   - SSH aktivieren in den Einstellungen

2. **Erste Schritte nach dem Start:**

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Hostname ändern (optional)
sudo raspi-config
# Navigieren zu: System Options -> Hostname -> "hotelpro"

# Neustart
sudo reboot
```

### Schritt 2: Node.js installieren

```bash
# Node.js 18 LTS installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Yarn installieren
sudo npm install -g yarn

# Prüfen
node --version  # sollte v18.x.x zeigen
yarn --version
```

### Schritt 3: Python und Dependencies

```bash
# Python 3 und pip
sudo apt-get install -y python3 python3-pip python3-venv

# Prüfen
python3 --version  # sollte 3.9+ sein
```

### Schritt 4: MongoDB installieren

```bash
# MongoDB für ARM64
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

sudo apt-get update
sudo apt-get install -y mongodb-org

# MongoDB starten und aktivieren
sudo systemctl start mongod
sudo systemctl enable mongod

# Status prüfen
sudo systemctl status mongod
```

### Schritt 5: HotelPro Code installieren

```bash
# Ins Home-Verzeichnis
cd ~

# Code klonen (oder manuell kopieren)
git clone https://github.com/IHR-USERNAME/hotelpro.git
cd hotelpro

# Backend einrichten
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Frontend einrichten
cd frontend
yarn install
cd ..
```

### Schritt 6: Konfiguration anpassen

**Backend (.env):**
```bash
cd ~/hotelpro/backend
nano .env
```

Inhalt:
```ini
MONGO_URL="mongodb://localhost:27017"
DB_NAME="hotel_management"
CORS_ORIGINS="*"
RESEND_API_KEY=""  # Optional
SENDER_EMAIL="onboarding@resend.dev"
```

**Frontend (.env):**
```bash
cd ~/hotelpro/frontend
nano .env
```

Inhalt:
```ini
# Raspberry Pi IP-Adresse verwenden
REACT_APP_BACKEND_URL=http://192.168.1.100:8001
```

**IP-Adresse herausfinden:**
```bash
hostname -I
```

### Schritt 7: Systemd Services erstellen (Autostart)

**Backend Service:**
```bash
sudo nano /etc/systemd/system/hotelpro-backend.service
```

Inhalt:
```ini
[Unit]
Description=HotelPro Backend Service
After=network.target mongod.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/hotelpro/backend
Environment="PATH=/home/pi/hotelpro/backend/venv/bin"
ExecStart=/home/pi/hotelpro/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Frontend bauen (Production):**
```bash
cd ~/hotelpro/frontend
GENERATE_SOURCEMAP=false yarn build
```

### Schritt 8: Nginx installieren (Web-Server)

```bash
# Nginx installieren
sudo apt-get install -y nginx

# Konfiguration erstellen
sudo nano /etc/nginx/sites-available/hotelpro
```

Inhalt:
```nginx
server {
    listen 80;
    server_name _;

    # Frontend (React Build)
    location / {
        root /home/pi/hotelpro/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Nginx aktivieren:**
```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/hotelpro /etc/nginx/sites-enabled/

# Default-Site deaktivieren
sudo rm /etc/nginx/sites-enabled/default

# Nginx testen und starten
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Schritt 9: Services starten

```bash
# Backend Service aktivieren und starten
sudo systemctl daemon-reload
sudo systemctl enable hotelpro-backend
sudo systemctl start hotelpro-backend

# Status prüfen
sudo systemctl status hotelpro-backend
sudo systemctl status nginx
sudo systemctl status mongod
```

---

## 🌐 Zugriff von anderen Geräten

### Raspberry Pi IP-Adresse finden:

```bash
hostname -I
```

Beispiel: `192.168.1.100`

### Von anderen Geräten zugreifen:

**Browser öffnen und eingeben:**
- `http://192.168.1.100` (Ihre Pi IP-Adresse)
- Oder: `http://raspberrypi.local` (falls mDNS funktioniert)
- Oder: `http://hotelpro.local` (falls Hostname geändert)

### Beispiele:

**Windows PC:**
```
http://192.168.1.100
```

**iPhone/iPad:**
```
http://192.168.1.100
```

**Android Tablet:**
```
http://192.168.1.100
```

Alle Geräte sehen die **gleichen Daten** in Echtzeit!

---

## 🔧 Wartung & Verwaltung

### Logs anschauen:

```bash
# Backend Logs
sudo journalctl -u hotelpro-backend -f

# Nginx Logs
sudo tail -f /var/log/nginx/error.log

# MongoDB Logs
sudo journalctl -u mongod -f
```

### Services neu starten:

```bash
# Backend neu starten
sudo systemctl restart hotelpro-backend

# Nginx neu starten
sudo systemctl restart nginx
```

### Updates installieren:

```bash
cd ~/hotelpro

# Code aktualisieren (von GitHub)
git pull

# Backend aktualisieren
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
deactivate

# Frontend neu bauen
cd ../frontend
yarn install
GENERATE_SOURCEMAP=false yarn build

# Services neu starten
sudo systemctl restart hotelpro-backend
sudo systemctl restart nginx
```

---

## 🐛 Problemlösungen

### Problem: "Seite nicht erreichbar"

**Lösung 1:** Firewall prüfen
```bash
sudo ufw allow 80/tcp
sudo ufw allow 8001/tcp
```

**Lösung 2:** Services prüfen
```bash
sudo systemctl status hotelpro-backend
sudo systemctl status nginx
```

**Lösung 3:** IP-Adresse prüfen
```bash
hostname -I
ip addr show
```

### Problem: "Backend startet nicht"

```bash
# Logs anschauen
sudo journalctl -u hotelpro-backend -n 50

# MongoDB läuft?
sudo systemctl status mongod

# Manuell testen
cd ~/hotelpro/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Problem: "Sehr langsam"

**Ursache:** Raspberry Pi überhitzt

**Lösung:**
```bash
# Temperatur prüfen
vcgencmd measure_temp

# Sollte unter 70°C sein
# Kühlkörper oder Lüfter hinzufügen
```

### Problem: "MongoDB nimmt zu viel Speicher"

```bash
# Speicher prüfen
df -h

# Alte Logs löschen
sudo journalctl --vacuum-time=7d
```

---

## 📊 Performance-Optimierung

### Swap erhöhen (für 2GB RAM-Modelle):

```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=2048 ändern
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Frontend-Caching optimieren:

```bash
sudo nano /etc/nginx/sites-available/hotelpro
```

Hinzufügen unter `location /`:
```nginx
expires 1y;
add_header Cache-Control "public, immutable";
```

---

## 🔐 Sicherheit

### HTTPS einrichten (mit Let's Encrypt):

```bash
# Certbot installieren
sudo apt-get install -y certbot python3-certbot-nginx

# Zertifikat erstellen (benötigt Domain)
sudo certbot --nginx -d ihre-domain.de
```

### Firewall aktivieren:

```bash
sudo apt-get install -y ufw
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Regelmäßige Backups:

```bash
# Backup-Script erstellen
nano ~/backup-hotelpro.sh
```

Inhalt:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --db hotel_management --out ~/backups/mongodb-$DATE
tar -czf ~/backups/hotelpro-$DATE.tar.gz ~/hotelpro
```

---

## 📱 Mobile App (Progressive Web App)

HotelPro kann als App auf dem Home-Screen gespeichert werden:

**iPhone/iPad:**
1. Safari öffnen → `http://192.168.1.100`
2. Teilen-Button → "Zum Home-Bildschirm"
3. Icon erscheint wie eine normale App

**Android:**
1. Chrome öffnen → `http://192.168.1.100`
2. Menü → "Zum Startbildschirm hinzufügen"
3. Icon erscheint wie eine normale App

---

## ✅ Checklist

- [ ] Raspberry Pi OS installiert und aktualisiert
- [ ] Node.js und Yarn installiert
- [ ] Python 3 und pip installiert
- [ ] MongoDB läuft
- [ ] HotelPro Code installiert
- [ ] Backend Service läuft
- [ ] Nginx läuft
- [ ] Von anderem Gerät erreichbar
- [ ] Backups eingerichtet

---

## 🎉 Erfolg!

Wenn alles funktioniert:

✅ HotelPro läuft 24/7 auf Raspberry Pi
✅ Zugriff von allen Geräten im Netzwerk
✅ Zentrale Datenbank
✅ Automatischer Start nach Neustart
✅ Professionelles Setup mit Nginx

**Stromverbrauch:** ~5-10W (sehr effizient!)
**Kosten:** ~€0,05 pro Tag Strom

---

**Version:** 1.0.0  
**Platform:** Raspberry Pi 4B (ARM64)  
**OS:** Raspberry Pi OS (64-bit)
