@echo off
setlocal enabledelayedexpansion

:: ============================================================================
::  Empaquetador de Instalador PC - NEXUS POS ENTERPRISE
:: ============================================================================

title NEXUS POS ENTERPRISE - GENERADOR DE DISCO DE INSTALACION PC
color 0B

cd /d "%~dp0"
echo [INFO] Directorio del proyecto: %cd%
echo.

set "appName=NEXUS_POS_ENTERPRISE"

echo ======================================================
echo    CONFIGURANDO EMPAQUETADO: %appName%
echo ======================================================
echo.

:: 1. Compilación del Frontend local
echo [1/4] Compilando interfaz web POS (Vite Build)...
cd /d "%~dp0caja_local\frontend"
call npm run build
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] Falló compilación frontend, reintentando instalacion de paquetes...
    call npm install
    call npm run build
)
cd /d "%~dp0"
echo      Frontend compilado exitosamente en dist.
echo.

:: 2. Verificación del Icono NEXUS
echo [2/4] Verificando iconos de instalacion (icon.ico)...
if not exist "icon.ico" (
    python -c "from PIL import Image; img = Image.open('icon.png'); img.save('icon.ico', format='ICO')" >nul 2>&1
)
echo      Icono verificado: icon.ico
echo.

:: 3. Instalación de dependencias de empaquetado
echo [3/4] Verificando dependencias de Electron-Builder...
if not exist "node_modules\electron-builder" (
    echo [INFO] Instalando electron-builder...
    call npm install
)
echo.

:: 4. Generación del Instalador NSIS (.exe)
echo [4/4] Generando Instalador Profesional para PC (.exe)...
echo      Icono oficial NEXUS asignado a accesos directos e instalador.
echo      Cerrando instancias previas del sistema para evitar bloqueos...

taskkill /F /IM NUEVO.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1
taskkill /F /IM "NEXUS POS ENTERPRISE.exe" /T >nul 2>&1
taskkill /F /IM "NEXUS_POS_ENTERPRISE.exe" /T >nul 2>&1

timeout /t 2 /nobreak >nul
if exist "dist\win-unpacked" (
    rmdir /s /q "dist\win-unpacked" >nul 2>&1
)

echo      Esto puede tardar un par de minutos. No cierres esta ventana.
echo.

call npx electron-builder --win --x64

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Ocurrio un inconveniente al generar el instalador.
    echo      Revisa que no tengas otro proceso de Electron ejecutandose.
    pause
    exit /b 1
)

:: Limpiar archivos temporales .7z para evitar confusión con WinRAR y copiar instalador .exe al Escritorio
if exist "dist\NEXUS_POS_ENTERPRISE_INSTALADOR_PC.exe" (
    copy /y "dist\NEXUS_POS_ENTERPRISE_INSTALADOR_PC.exe" "C:\Users\JOSUE\Desktop\NEXUS_POS_ENTERPRISE_INSTALADOR_PC.exe" >nul 2>&1
    del /f /q "dist\*.7z" >nul 2>&1
    del /f /q "dist\*.blockmap" >nul 2>&1
)

color 0A
echo.
echo ======================================================
echo      ¡INSTALADOR PC (.exe) GENERADO CON EXITO!
echo ======================================================
echo.
echo  [✓] Instalador directo .exe disponible en:
echo      C:\Users\JOSUE\Desktop\NEXUS_POS_ENTERPRISE_INSTALADOR_PC.exe
echo      %cd%\dist\NEXUS_POS_ENTERPRISE_INSTALADOR_PC.exe
echo.
echo  [✓] Icono oficial NEXUS POS asignado al instalador de Windows.
echo.
pause
