@echo off
echo ========================================
echo Building Windows Installer
echo ========================================

cd ..

echo Step 1: Building Backend...
call build-scripts\build-backend.bat
if errorlevel 1 goto error

echo.
echo Step 2: Building Frontend...
call build-scripts\build-frontend.bat
if errorlevel 1 goto error

echo.
echo Step 3: Building Electron App...
echo Installing Electron dependencies...
call yarn install

echo Creating Windows Installer...
call yarn electron:build

if exist "dist\HotelPro-Setup-*.exe" (
    echo.
    echo ========================================
    echo ✓✓✓ BUILD SUCCESSFUL! ✓✓✓
    echo ========================================
    echo.
    echo Your installer is ready!
    echo Location: dist\HotelPro-Setup-[version].exe
    echo.
    echo You can now distribute this installer to install
    echo HotelPro on any Windows computer.
    echo ========================================
) else (
    echo.
    echo ✗ Failed to create installer!
    exit /b 1
)

goto end

:error
echo.
echo ✗ Build failed! Check the error messages above.
exit /b 1

:end
echo Done!
