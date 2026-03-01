# 🔍 Schnelle Checkliste - Bevor Sie das Script ausführen

## ✅ Voraussetzungen prüfen:

### 1. Code auf Raspberry Pi kopiert?

```bash
# Prüfen Sie, ob der Code da ist:
ls -la ~/hotelpro/

# Sie sollten sehen:
# - backend/
# - frontend/
# - raspberry-pi/
# - package.json
# - README.md
# etc.
```

**Falls NICHT vorhanden:**
→ Code muss erst auf den Raspberry Pi kopiert werden!

---

## 📥 Code auf Raspberry Pi bekommen

### Option 1: Via SCP (von Windows)

**Auf Windows (PowerShell):**
```powershell
# Ins Projekt-Verzeichnis
cd C:\ProTel\app

# Auf Raspberry Pi kopieren
scp -r * pi@192.168.1.XXX:/home/pi/hotelpro/
```

Ersetzen Sie `192.168.1.XXX` mit der IP Ihres Raspberry Pi!

### Option 2: Via WinSCP (Grafisch)

1. **WinSCP herunterladen:** https://winscp.net/
2. **Verbinden:**
   - Host: `192.168.1.XXX` (Pi IP)
   - User: `pi`
   - Password: Ihr Pi-Passwort
3. **Drag & Drop:**
   - Von: `C:\ProTel\app`
   - Nach: `/home/pi/hotelpro`

### Option 3: Via USB-Stick

1. **Auf Windows:** Code auf USB-Stick kopieren
2. **USB an Raspberry Pi anschließen**
3. **Auf Raspberry Pi:**
```bash
# USB-Stick mounten (meist automatisch als /media/pi/...)
ls /media/pi/

# Kopieren
cp -r /media/pi/USB-NAME/app ~/hotelpro
```

### Option 4: Via Git (wenn auf GitHub)

```bash
cd ~
git clone https://github.com/bootsy0815/hotelpro.git
```

---

## 🚀 Installation starten

**Nachdem der Code in `/home/pi/hotelpro` ist:**

```bash
# 1. Ins Verzeichnis wechseln
cd ~/hotelpro

# 2. Script-Berechtigungen setzen
chmod +x raspberry-pi/install-raspberry-simple.sh

# 3. Installation starten
sudo ./raspberry-pi/install-raspberry-simple.sh
```

---

## 🔧 Struktur prüfen

**Vor Installation prüfen:**

```bash
cd ~/hotelpro

# Diese Ordner MÜSSEN existieren:
ls -d backend/
ls -d frontend/
ls -d raspberry-pi/

# Diese Dateien MÜSSEN existieren:
ls backend/server.py
ls backend/requirements.txt
ls frontend/package.json
ls raspberry-pi/install-raspberry-simple.sh
```

**Wenn etwas fehlt:**
→ Code wurde nicht vollständig kopiert!

---

## 📍 Raspberry Pi IP-Adresse finden

```bash
hostname -I
```

Beispiel-Ausgabe: `192.168.1.100`

Diese IP brauchen Sie für:
- SCP-Kopieren
- WinSCP
- Später: Browser-Zugriff

---

## 🐛 Häufige Probleme

### Problem: "No such file or directory"

**Ursache:** Code nicht am richtigen Ort

**Lösung:**
```bash
# Prüfen wo Sie sind:
pwd

# Sollte zeigen: /home/pi/hotelpro

# Falls nicht:
cd ~/hotelpro
```

### Problem: "Permission denied"

**Ursache:** Script ohne sudo ausgeführt

**Lösung:**
```bash
sudo ./raspberry-pi/install-raspberry-simple.sh
```

### Problem: "Script not found"

**Ursache:** Keine Ausführungsberechtigung

**Lösung:**
```bash
chmod +x raspberry-pi/install-raspberry-simple.sh
```

---

## ✅ Bereit zur Installation?

**Checkliste:**
- [ ] Code liegt in `/home/pi/hotelpro`
- [ ] `backend/` Ordner existiert
- [ ] `frontend/` Ordner existiert
- [ ] Sie sind im `hotelpro` Verzeichnis (`cd ~/hotelpro`)
- [ ] Script hat Ausführungsberechtigung (`chmod +x`)

**Dann kann es losgehen:**
```bash
sudo ./raspberry-pi/install-raspberry-simple.sh
```

**Dauer:** 10-15 Minuten

**Danach:** 
```
http://[IHRE-PI-IP]
```

---

## 📞 Schnellhilfe

**Code-Verzeichnis prüfen:**
```bash
cd ~/hotelpro && ls -la
```

**Script-Pfad prüfen:**
```bash
ls -la raspberry-pi/install-raspberry-simple.sh
```

**Alles in einem Befehl:**
```bash
cd ~/hotelpro && \
chmod +x raspberry-pi/install-raspberry-simple.sh && \
sudo ./raspberry-pi/install-raspberry-simple.sh
```
