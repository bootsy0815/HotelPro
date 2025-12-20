# HotelPro - Desktop Anwendung

## 🎯 Übersicht

HotelPro ist jetzt eine vollwertige Windows Desktop-Anwendung mit professionellem Installer!

## 📦 Was ist enthalten?

- **Electron Desktop App**: Native Windows-Anwendung
- **Tray Icon**: Läuft im Hintergrund
- **Automatischer Backend-Start**: Keine manuelle Konfiguration nötig
- **Windows Installer**: Einfache Installation auf jedem Windows-PC

## 🛠️ Installer erstellen

### Voraussetzungen

1. **Node.js** (v18 oder höher): https://nodejs.org/
2. **Python** (v3.9 oder höher): https://www.python.org/
3. **Yarn**: `npm install -g yarn`
4. **MongoDB**: https://www.mongodb.com/try/download/community

### Build-Prozess

#### Automatischer Build (Empfohlen)

Öffnen Sie PowerShell/CMD im Projekt-Ordner und führen Sie aus:

```bash
build-scripts\build-installer.bat
```

Dieser Befehl:
1. ✓ Kompiliert das Backend zu server.exe
2. ✓ Baut das React Frontend
3. ✓ Erstellt die Electron App
4. ✓ Generiert den Windows Installer

**Fertig!** Der Installer befindet sich in: `dist/HotelPro-Setup-[version].exe`

#### Manueller Build (Falls Probleme auftreten)

**Schritt 1: Backend kompilieren**
```bash
cd backend
pip install pyinstaller
pyinstaller build_exe.spec --clean
cd ..
```

**Schritt 2: Frontend bauen**
```bash
cd frontend
yarn install
set GENERATE_SOURCEMAP=false
yarn build
cd ..
```

**Schritt 3: Electron Installer erstellen**
```bash
yarn install
yarn electron:build
```

## 📥 Installation

### Für Endbenutzer

1. Installer herunterladen: `HotelPro-Setup-[version].exe`
2. Doppelklick auf den Installer
3. Installationsordner wählen
4. Installation abschließen
5. HotelPro über Desktop-Icon starten

### Erste Schritte nach Installation

1. **MongoDB installieren** (falls noch nicht vorhanden):
   - Download: https://www.mongodb.com/try/download/community
   - Als Windows Service installieren

2. **HotelPro starten**:
   - Desktop-Icon doppelklicken ODER
   - Start-Menü → HotelPro

3. **Tray Icon**:
   - App läuft im Hintergrund (System Tray)
   - Rechtsklick für Optionen

## ⚙️ Konfiguration

Nach der Installation finden Sie die Konfigurationsdateien unter:
```
C:\Program Files\HotelPro\resources\backend\.env
```

**Standard-Konfiguration:**
```ini
MONGO_URL=mongodb://localhost:27017
DB_NAME=hotel_management
CORS_ORIGINS=*
RESEND_API_KEY=
SENDER_EMAIL=onboarding@resend.dev
```

### E-Mail aktivieren

1. Resend API Key holen: https://resend.com
2. In `.env` eintragen:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   SENDER_EMAIL=ihre-email@domain.de
   ```
3. HotelPro neu starten

## 🔧 Entwicklung

### Development-Modus starten

```bash
# Terminal 1: Backend starten
cd backend
uvicorn server:app --reload --port 8001

# Terminal 2: Frontend starten
cd frontend
yarn start

# Terminal 3: Electron starten
set NODE_ENV=development
yarn electron:dev
```

## 📝 Package.json Scripts

- `yarn electron:dev` - Entwicklungsmodus
- `yarn electron:build` - Windows Installer erstellen
- `yarn electron:build:dir` - Nur App ohne Installer

## 🐛 Troubleshooting

### "Backend failed to start"
**Lösung**: MongoDB muss laufen
```bash
net start MongoDB
```

### "PyInstaller not found"
**Lösung**: 
```bash
pip install pyinstaller
```

### "Build failed"
**Lösungen**:
1. Alle Abhängigkeiten installieren: `yarn install` und `pip install -r requirements.txt`
2. Node.js und Python zum PATH hinzufügen
3. Als Administrator ausführen

### Installer startet nicht
**Lösung**: Als Administrator installieren

## 📂 Projekt-Struktur

```
HotelPro/
├── electron/              # Electron main process
│   ├── main.js
│   ├── preload.js
│   └── assets/           # Icons
├── backend/              # FastAPI Backend
│   ├── server.py
│   ├── build_exe.spec   # PyInstaller config
│   └── .env
├── frontend/             # React Frontend
│   ├── src/
│   └── build/           # Production build
├── build-scripts/       # Build automation
│   ├── build-backend.bat
│   ├── build-frontend.bat
│   └── build-installer.bat
├── dist/                # Installer output
│   └── HotelPro-Setup-*.exe
└── electron-builder.json # Installer config
```

## 🚀 Verteilung

Der generierte Installer (`HotelPro-Setup-[version].exe`) kann auf jedem Windows-PC installiert werden.

**Voraussetzungen auf Ziel-PC:**
- Windows 10/11 (64-bit)
- MongoDB (muss separat installiert werden)
- ~200 MB freier Speicherplatz

## 📞 Support

Bei Problemen:
1. Logs prüfen: `%APPDATA%\HotelPro\logs`
2. MongoDB Status: `net start MongoDB`
3. Neuinstallation als Administrator

## 🎉 Features

✅ Native Windows Desktop App
✅ System Tray Integration
✅ Automatischer Backend-Start
✅ Keine Browserabhängigkeit
✅ Offline-Funktionalität
✅ Professioneller Installer
✅ Auto-Update bereit (konfigurierbar)

---

**Version**: 1.0.0
**Platform**: Windows 10/11 (64-bit)
**License**: MIT
