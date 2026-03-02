# 🖥️ HotelPro auf Proxmox LXC - Komplette Anleitung

## 📋 Übersicht

Diese Anleitung zeigt, wie Sie HotelPro in einem **Proxmox LXC Container** mit **Debian 13** installieren.

**Vorteile LXC vs. Raspberry Pi:**
- ✅ **Schneller**: Mehr CPU/RAM verfügbar
- ✅ **Einfacher**: Keine Hardware-Setup nötig
- ✅ **Flexibler**: Ressourcen anpassbar
- ✅ **Stabiler**: Enterprise-Level Virtualisierung
- ✅ **Backups**: Proxmox Snapshot-Funktion

---

## 🚀 Schnellstart (3 Schritte)

### 1. LXC Container erstellen (5 Minuten)
### 2. Code in LXC kopieren (2 Minuten)
### 3. Installation ausführen (10 Minuten)

**Gesamt: ~17 Minuten bis HotelPro läuft!**

---

## 📦 Teil 1: LXC Container erstellen

### In Proxmox Web-UI:

1. **Klicken Sie auf "Create CT"** (oben rechts)

2. **General Tab:**
   - Node: [Ihr Proxmox Node]
   - CT ID: `100` (oder nächste freie ID)
   - Hostname: `hotelpro`
   - Password: [Sicheres Root-Passwort]
   - ✅ Unprivileged container: **JA**
   - ✅ Nesting: **JA** (wichtig!)

3. **Template Tab:**
   - Storage: `local`
   - Template: **Debian 13 (Trixie)** oder **Debian 12 (Bookworm)**
   
   **Falls Template fehlt:**
   ```bash
   # Auf Proxmox Host ausführen:
   pveam update
   pveam available | grep debian
   pveam download local debian-13-standard_13.0-1_amd64.tar.zst
   ```

4. **Disks Tab:**
   - Storage: `local-lvm` (oder Ihr Storage)
   - Disk size: **10 GB** (Minimum: 8 GB)

5. **CPU Tab:**
   - Cores: **2** (Minimum: 1)

6. **Memory Tab:**
   - Memory: **2048 MB** (Minimum: 1024 MB)
   - Swap: **512 MB**

7. **Network Tab:**
   - Bridge: `vmbr0`
   - ✅ Firewall: Optional
   - IPv4: **DHCP** (oder statische IP)
   - IPv6: **DHCP** (optional)

8. **DNS Tab:**
   - Use host settings: **JA**

9. **Confirm Tab:**
   - ✅ Start after created: **JA**
   - **Finish** klicken

### Container starten:

```bash
# Falls nicht automatisch gestartet:
pct start 100

# In Container einloggen:
pct enter 100
```

---

## 📁 Teil 2: Code in LXC kopieren

### Option A: Von Windows PC via SCP (EMPFOHLEN)

**Schritt 1: LXC IP-Adresse finden**

In Proxmox Web-UI:
- Container auswählen → Summary → IP Address notieren
- Beispiel: `192.168.1.150`

**Schritt 2: Code kopieren**

**Mit WinSCP (Grafisch):**
1. WinSCP öffnen: https://winscp.net/
2. Verbindung:
   - Host: `192.168.1.150` (LXC IP)
   - User: `root`
   - Password: [LXC Root-Passwort]
3. Drag & Drop: `C:\ProTel\app` → `/root/hotelpro`

**Mit SCP (Kommandozeile):**
```powershell
# Windows PowerShell
cd C:\ProTel\app
scp -r * root@192.168.1.150:/root/hotelpro/
```

### Option B: Direkt auf Proxmox Host

**Schritt 1: Code auf Proxmox Host kopieren**
```bash
# Via SCP auf Proxmox Host
scp -r C:\ProTel\app root@PROXMOX-IP:/tmp/hotelpro
```

**Schritt 2: In LXC kopieren**
```bash
# Auf Proxmox Host:
pct push 100 /tmp/hotelpro /root/hotelpro -recursive
```

### Option C: Via Git (wenn auf GitHub)

```bash
# Im LXC Container:
apt update && apt install -y git
cd /root
git clone https://github.com/bootsy0815/hotelpro.git
```

---

## ⚙️ Teil 3: Installation durchführen

### In LXC Container einloggen:

**Via Proxmox Web-UI:**
- Container auswählen → Console

**Via SSH:**
```bash
ssh root@192.168.1.150
```

**Via Proxmox Host:**
```bash
pct enter 100
```

### Installation starten:

```bash
# Ins Verzeichnis wechseln
cd /root/hotelpro

# Script ausführbar machen
chmod +x proxmox-lxc/install-proxmox-lxc.sh

# Installation starten
./proxmox-lxc/install-proxmox-lxc.sh
```

**Das Script installiert automatisch:**
1. ✅ Node.js 18 LTS
2. ✅ Python 3 + Dependencies
3. ✅ MongoDB 7.0
4. ✅ Nginx Webserver
5. ✅ Backend Setup
6. ✅ Frontend Build
7. ✅ Systemd Services
8. ✅ Auto-Start Konfiguration

**Dauer: 10-15 Minuten**

---

## 🌐 Teil 4: Zugriff von anderen Geräten

### LXC IP-Adresse finden:

**Im LXC:**
```bash
hostname -I
```

**In Proxmox Web-UI:**
- Container → Summary → IP Address

### Von anderen Geräten zugreifen:

**Browser öffnen auf:**
- Windows PC: `http://192.168.1.150`
- Mac: `http://192.168.1.150`
- Tablet: `http://192.168.1.150`
- Smartphone: `http://192.168.1.150`

**Alle Geräte sehen die gleichen Daten!**

---

## 🔧 Wartung & Verwaltung

### Services verwalten:

```bash
# Status prüfen
systemctl status hotelpro-backend
systemctl status nginx
systemctl status mongod

# Neu starten
systemctl restart hotelpro-backend
systemctl restart nginx

# Logs anzeigen
journalctl -u hotelpro-backend -f
journalctl -u mongod -f
```

### LXC Container verwalten:

**Auf Proxmox Host:**

```bash
# Container stoppen
pct stop 100

# Container starten
pct start 100

# Container neu starten
pct reboot 100

# In Container einloggen
pct enter 100

# Container Status
pct status 100
```

### Ressourcen anpassen:

**In Proxmox Web-UI:**
1. Container auswählen
2. **Resources** Tab
3. RAM/CPU anpassen
4. Container neu starten

**Via Kommandozeile:**
```bash
# RAM ändern (auf 4GB)
pct set 100 -memory 4096

# CPU Cores ändern (auf 4)
pct set 100 -cores 4

# Disk erweitern (um 10GB)
pct resize 100 rootfs +10G
```

---

## 💾 Backup & Restore

### Backup erstellen:

**Via Proxmox Web-UI:**
1. Container auswählen
2. **Backup** → **Backup now**
3. Storage wählen
4. **Backup** klicken

**Via Kommandozeile:**
```bash
# Auf Proxmox Host
vzdump 100 --storage local --compress zstd
```

### Backup wiederherstellen:

**Via Proxmox Web-UI:**
1. Storage → Backups
2. Backup auswählen
3. **Restore** klicken

---

## 📊 Performance-Optimierung

### Für produktiven Einsatz empfohlen:

**LXC Ressourcen:**
- **RAM**: 4 GB (für 10+ gleichzeitige User)
- **CPU**: 4 Cores
- **Disk**: 20 GB (mit Wachstum)

**Anpassen:**
```bash
pct set 100 -memory 4096 -cores 4
pct resize 100 rootfs +10G
pct reboot 100
```

### MongoDB Tuning:

```bash
# Im LXC Container
nano /etc/mongod.conf
```

Hinzufügen:
```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1  # 1GB für MongoDB Cache
```

```bash
systemctl restart mongod
```

---

## 🔐 Sicherheit

### Firewall aktivieren (optional):

```bash
# Im LXC Container
apt install -y ufw
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### HTTPS einrichten (mit Let's Encrypt):

```bash
# Certbot installieren
apt install -y certbot python3-certbot-nginx

# Zertifikat erstellen (Domain erforderlich)
certbot --nginx -d ihre-domain.de

# Auto-Renewal testen
certbot renew --dry-run
```

### Automatische Updates:

```bash
# Unattended upgrades aktivieren
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## 🐛 Problemlösungen

### Problem: "MongoDB startet nicht"

```bash
# Logs prüfen
journalctl -u mongod -n 50

# MongoDB neu installieren
apt remove --purge mongodb-org
apt autoremove
rm -rf /var/lib/mongodb
rm -rf /var/log/mongodb
# Dann install-script erneut ausführen
```

### Problem: "Seite nicht erreichbar"

```bash
# Services prüfen
systemctl status nginx
systemctl status hotelpro-backend

# Ports prüfen
ss -tulpn | grep :80
ss -tulpn | grep :8001

# Nginx neu starten
systemctl restart nginx
```

### Problem: "Out of Memory"

```bash
# RAM erhöhen (Proxmox Host)
pct set 100 -memory 4096
pct reboot 100
```

### Problem: "Disk voll"

```bash
# Speicher prüfen
df -h

# Logs leeren
journalctl --vacuum-time=7d
apt clean

# Disk erweitern (Proxmox Host)
pct resize 100 rootfs +10G
```

---

## 📱 Erweiterte Features

### Port-Forwarding (Internet-Zugriff):

**Auf Proxmox Host / Router:**
1. Port 80 auf LXC IP weiterleiten
2. DynDNS einrichten (optional)
3. HTTPS mit Certbot aktivieren

### Monitoring einrichten:

```bash
# Netdata installieren (System-Monitoring)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Zugriff: http://LXC-IP:19999
```

### Automatische Backups:

**In Proxmox Web-UI:**
1. Datacenter → Backup
2. Add → Backup Job
3. Schedule: täglich 2:00 Uhr
4. Retention: 7 Backups

---

## ✅ Checkliste

- [ ] LXC Container erstellt (Debian 13, 2GB RAM, 2 Cores)
- [ ] Code nach /root/hotelpro kopiert
- [ ] install-proxmox-lxc.sh ausgeführt
- [ ] Alle Services laufen (backend, nginx, mongod)
- [ ] Von anderem Gerät erreichbar
- [ ] Backup-Job eingerichtet
- [ ] Ressourcen für Produktion angepasst (optional)

---

## 🎉 Erfolg!

**Wenn alles funktioniert:**

✅ HotelPro läuft 24/7 im LXC
✅ Zugriff von allen Geräten im Netzwerk
✅ Automatische Backups via Proxmox
✅ Snapshots für schnelles Rollback
✅ Ressourcen dynamisch anpassbar
✅ Enterprise-Level Stabilität

**Vorteile vs. Raspberry Pi:**
- 🚀 **5-10x schneller**
- 💾 **Einfache Backups** (1-Click)
- 📈 **Skalierbar** (RAM/CPU anpassbar)
- 🔄 **Snapshots** (vor Updates)
- 🛡️ **Stabiler** (keine SD-Karten-Probleme)

---

**Version:** 1.0.0  
**Platform:** Proxmox LXC  
**OS:** Debian 13 (Trixie) / Debian 12 (Bookworm)  
**Ressourcen:** 2GB RAM, 2 CPU Cores, 10GB Disk (empfohlen)
