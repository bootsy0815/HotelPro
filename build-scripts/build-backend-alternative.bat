@echo off
echo ========================================
echo Backend Build - Alternative Methode
echo ========================================
echo.
echo Diese Methode erstellt kein .exe, sondern
echo ein portables Backend-Paket mit Python.
echo.

cd backend

echo Schritt 1: Virtuelle Umgebung erstellen...
python -m venv build_env

echo Schritt 2: Aktiviere virtuelle Umgebung...
call build_env\Scripts\activate.bat

echo Schritt 3: Installiere Abhangigkeiten...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo Schritt 4: Erstelle Start-Script...
echo @echo off > start_server.bat
echo echo Starting HotelPro Backend... >> start_server.bat
echo call build_env\Scripts\activate.bat >> start_server.bat
echo python server.py >> start_server.bat
echo pause >> start_server.bat

echo.
echo ========================================
echo Alternative Backend-Paket erstellt!
echo ========================================
echo.
echo Das Backend kann jetzt gestartet werden mit:
echo   backend\start_server.bat
echo.
echo HINWEIS: Diese Methode benotigt Python auf
echo dem Ziel-PC. Fur .exe-Version muss PyInstaller
echo funktionieren.
echo.

cd ..
pause
