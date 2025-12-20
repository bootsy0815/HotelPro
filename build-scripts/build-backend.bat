@echo off
echo ========================================
echo Building Backend Executable
echo ========================================

cd backend

echo Installing PyInstaller...
python -m pip install pyinstaller

echo Building server.exe...
python -m PyInstaller build_exe.spec --clean

if exist "dist\server.exe" (
    echo.
    echo ✓ Backend executable built successfully!
    echo Location: backend\dist\server.exe
) else (
    echo.
    echo ✗ Failed to build backend executable!
    exit /b 1
)

cd ..
echo Done!
