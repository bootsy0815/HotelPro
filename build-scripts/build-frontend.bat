@echo off
echo ========================================
echo Building Frontend Production Build
echo ========================================

cd ..
cd frontend

echo Installing dependencies...
call yarn install

echo Building React app...
set "GENERATE_SOURCEMAP=false"
call yarn build

if exist "build\index.html" (
    echo.
    echo ✓ Frontend built successfully!
    echo Location: frontend\build\
) else (
    echo.
    echo ✗ Failed to build frontend!
    exit /b 1
)

cd ..
echo Done!
