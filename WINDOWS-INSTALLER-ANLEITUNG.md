# 🎯 Windows Installer Erstellen - Vollständige Anleitung

## 📋 Inhaltsverzeichnis
1. [Systemanforderungen](#systemanforderungen)
2. [Vorbereitungen](#vorbereitungen)
3. [Code Herunterladen](#code-herunterladen)
4. [Installer Erstellen](#installer-erstellen)
5. [Installer Verteilen](#installer-verteilen)
6. [Problemlösungen](#problemlösungen)

---

## 🖥️ Systemanforderungen

### Zum Erstellen des Installers benötigen Sie:
- **Windows 10** oder neuer (64-bit)
- **Mindestens 4 GB RAM**
- **5 GB freier Festplattenspeicher**
- **Internet-Verbindung** (für Downloads)

### Software die installiert werden muss:
1. **Node.js v18+**: https://nodejs.org/ (LTS Version empfohlen)
2. **Python 3.9+**: https://www.python.org/downloads/
3. **Git** (optional): https://git-scm.com/download/win

---

## 🛠️ Vorbereitungen

### Schritt 1: Node.js installieren

1. Download von: https://nodejs.org/
2. Installer ausführen
3. ✅ **WICHTIG**: Bei der Installation "Add to PATH" aktivieren
4. Installation abschließen
5. **Prüfen** - CMD öffnen und eingeben:
   ```bash
   node --version
   npm --version
   ```
   Sollte Versionsnummern anzeigen (z.B. v20.11.0)

### Schritt 2: Python installieren

1. Download von: https://www.python.org/downloads/
2. Installer ausführen
3. ✅ **SEHR WICHTIG**: "Add Python to PATH" ankreuzen!
4. "Install Now" klicken
5. **Prüfen** - CMD öffnen und eingeben:
   ```bash
   python --version
   pip --version
   ```
   Sollte Versionsnummern anzeigen (z.B. Python 3.11.0)

### Schritt 3: Yarn installieren

CMD als **Administrator** öffnen und eingeben:
```bash
npm install -g yarn
```

Prüfen:
```bash
yarn --version
```

### Schritt 4: MongoDB installieren (optional)

**Nur wenn Sie MongoDB lokal testen möchten:**

1. Download: https://www.mongodb.com/try/download/community
2. Installer ausführen
3. Bei Installation: "Install MongoDB as a Service" aktivieren
4. Installation abschließen

---

## 📥 Code Herunterladen

### Option A: Via GitHub (wenn Code dort gespeichert ist)

1. **CMD** oder **PowerShell** öffnen
2. Zum gewünschten Ordner navigieren:
   ```bash
   cd C:\Projekte
   ```
3. Repository klonen:
   ```bash
   git clone https://github.com/IHR-USERNAME/hotelpro.git
   cd hotelpro
   ```

### Option B: ZIP-Datei

1. Code als ZIP herunterladen
2. Entpacken nach z.B. `C:\Projekte\hotelpro`
3. **CMD** öffnen und navigieren:
   ```bash
   cd C:\Projekte\hotelpro
   ```

---

## 🏗️ Installer Erstellen

### ⚡ Automatischer Build (EMPFOHLEN)

**So einfach geht's:**

1. **CMD** oder **PowerShell** als Administrator öffnen
2. Zum Projekt-Ordner navigieren:
   ```bash
   cd C:\Projekte\hotelpro
   ```
3. Build-Script ausführen:
   ```bash
   build-scripts\build-installer.bat
   ```

4. **Warten Sie...** Der Prozess dauert 5-15 Minuten und durchläuft:
   - ⏳ Backend kompilieren (Python → .exe)
   - ⏳ Frontend bauen (React)
   - ⏳ Electron-App erstellen
   - ⏳ Windows-Installer generieren

5. **✅ Fertig!** 
   Bei Erfolg sehen Sie:
   ```
   ✓✓✓ BUILD SUCCESSFUL! ✓✓✓
   Your installer is ready!
   Location: dist\HotelPro-Setup-1.0.0.exe
   ```

### 📦 Ihr Installer

Der fertige Installer befindet sich in:
```
C:\Projekte\hotelpro\dist\HotelPro-Setup-1.0.0.exe
```

**Größe:** Ca. 150-200 MB

---

## 🔧 Manueller Build (Falls automatischer Build fehlschlägt)

### Schritt 1: Abhängigkeiten installieren

```bash
# Im Hauptverzeichnis
yarn install

# Backend
cd backend
pip install -r requirements.txt
pip install pyinstaller
cd ..

# Frontend
cd frontend
yarn install
cd ..
```

### Schritt 2: Backend kompilieren

```bash
cd backend
pyinstaller build_exe.spec --clean
```

**Erfolg?** Prüfen Sie:
```bash
dir dist\server.exe
```
Sollte die Datei anzeigen (~50 MB)

### Schritt 3: Frontend bauen

```bash
cd ..\frontend
set GENERATE_SOURCEMAP=false
yarn build
```

**Erfolg?** Prüfen Sie:
```bash
dir build\index.html
```

### Schritt 4: Installer erstellen

```bash
cd ..
yarn electron:build
```

**Erfolg?** Prüfen Sie:
```bash
dir dist\HotelPro-Setup-*.exe
```

---

## 📤 Installer Verteilen

### Installer auf USB-Stick kopieren

1. USB-Stick einstecken (z.B. Laufwerk E:)
2. Installer kopieren:
   ```bash
   copy dist\HotelPro-Setup-1.0.0.exe E:\
   ```

### Installation auf anderem PC

1. **HotelPro-Setup-1.0.0.exe** kopieren
2. Doppelklick auf Installer
3. Installationsordner wählen (Standard: `C:\Program Files\HotelPro`)
4. Installation durchführen
5. Desktop-Icon wird erstellt

### ⚙️ Nach Installation auf Ziel-PC

**Voraussetzungen auf dem Ziel-PC:**
1. **Windows 10/11** (64-bit)
2. **MongoDB** muss installiert sein:
   - Download: https://www.mongodb.com/try/download/community
   - Als Service installieren

**HotelPro starten:**
- Desktop-Icon doppelklicken ODER
- Start-Menü → HotelPro

**Erstes Mal starten:**
- MongoDB wird automatisch verbunden
- App startet und läuft im System Tray

---

## 🐛 Problemlösungen

### Problem: "Node.js nicht gefunden"

**Ursache:** Node.js nicht im PATH

**Lösung:**
1. Node.js neu installieren
2. Bei Installation "Add to PATH" aktivieren
3. Computer neu starten
4. Erneut versuchen

### Problem: "Python nicht gefunden"

**Ursache:** Python nicht im PATH

**Lösung:**
1. Python neu installieren
2. ✅ "Add Python to PATH" aktivieren
3. Computer neu starten
4. In CMD prüfen: `python --version`

### Problem: "pip nicht gefunden"

**Lösung:**
```bash
python -m ensurepip --upgrade
```

### Problem: "PyInstaller failed"

**Mögliche Ursachen & Lösungen:**

1. **Nicht als Administrator ausgeführt**
   - Lösung: CMD als Administrator starten

2. **Antivirensoftware blockiert**
   - Lösung: Projektordner zur Ausnahmeliste hinzufügen

3. **Alte Python-Version**
   - Lösung: Python 3.9+ installieren

4. **Dependencies fehlen**
   ```bash
   cd backend
   pip install -r requirements.txt --force-reinstall
   ```

### Problem: "Electron Build failed"

**Lösung 1:** Yarn Cache leeren
```bash
yarn cache clean
yarn install
```

**Lösung 2:** node_modules neu installieren
```bash
rmdir /s /q node_modules
yarn install
```

### Problem: "Backend startet nicht im Installer"

**Ursache:** .env Datei fehlt

**Lösung:**
1. Sicherstellen dass `backend/.env` existiert
2. Neu bauen
3. Prüfen dass .env im spec-File eingetragen ist

### Problem: "MongoDB connection error"

**Auf Build-PC:**
- MongoDB muss nicht laufen zum Bauen

**Auf Ziel-PC:**
- MongoDB **muss** installiert sein
- MongoDB Service starten: `net start MongoDB`
- In App-Einstellungen Connection String prüfen

### Problem: Installer ist zu groß (>500 MB)

**Ursache:** Source Maps oder Debug-Dateien enthalten

**Lösung:**
```bash
# Frontend ohne Source Maps bauen
cd frontend
set GENERATE_SOURCEMAP=false
yarn build

# Backend im Release-Modus
cd ..\backend
pyinstaller build_exe.spec --clean
```

### Problem: "Access Denied" beim Installieren

**Lösung:**
- Installer **als Administrator** ausführen
- Rechtsklick → "Als Administrator ausführen"

---

## 📊 Checklist vor dem Build

- [ ] Node.js installiert (v18+)
- [ ] Python installiert (v3.9+) 
- [ ] Yarn installiert
- [ ] Alle Dependencies installiert (`yarn install`, `pip install -r requirements.txt`)
- [ ] PyInstaller installiert (`pip install pyinstaller`)
- [ ] .env Dateien vorhanden
- [ ] Als Administrator ausgeführt
- [ ] Genug Speicherplatz (5 GB)
- [ ] Stabile Internet-Verbindung

---

## 🎯 Build-Zeiten

**Durchschnittliche Dauer:**
- Backend kompilieren: 3-5 Minuten
- Frontend bauen: 2-3 Minuten  
- Electron-Installer: 5-10 Minuten
- **GESAMT:** 10-18 Minuten

**Bei langsamem PC:** Bis zu 30 Minuten

---

## 📞 Support

### Logs prüfen

**Build-Logs:**
- CMD-Ausgabe speichern
- Fehler am Ende prüfen

**App-Logs nach Installation:**
```
C:\Users\[Username]\AppData\Roaming\HotelPro\logs
```

### Häufige Erfolgsmeldungen

✅ **Backend:**
```
✓ Backend executable built successfully!
Location: backend\dist\server.exe
```

✅ **Frontend:**
```
✓ Frontend built successfully!
Location: frontend\build\
```

✅ **Installer:**
```
✓✓✓ BUILD SUCCESSFUL! ✓✓✓
Location: dist\HotelPro-Setup-1.0.0.exe
```

---

## 🎉 Erfolg!

Wenn alles geklappt hat, haben Sie jetzt:

✅ Einen Windows-Installer (~150-200 MB)
✅ Installierbar auf jedem Windows 10/11 PC
✅ Keine manuelle Konfiguration nötig
✅ Professionelles Setup mit Uninstaller
✅ Desktop-Icon und Start-Menü-Eintrag

**Verteilung:**
- Installer per USB-Stick, E-Mail oder Cloud teilen
- Auf jedem Windows-PC installierbar
- Keine Entwickler-Tools auf Ziel-PC nötig

---

**Version:** 1.0.0  
**Aktualisiert:** Dezember 2025  
**Platform:** Windows 10/11 (64-bit)
