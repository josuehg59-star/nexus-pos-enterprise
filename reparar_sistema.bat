@echo off
chcp 65001 >nul
title Optimización y Reparación del Sistema contra Congelamientos
echo ========================================================
echo   REPARACIÓN DE DISCO Y SISTEMA CONTRA CONGELAMIENTOS
echo ========================================================
echo.

:: Verificar permisos de Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Este script debe ejecutarse como Administrador.
    echo Por favor, haz clic derecho en este archivo y selecciona:
    echo "Ejecutar como administrador".
    echo.
    pause
    exit /b
)

echo [1/4] Configurando archivo de paginación (Pagefile) exclusivamente en C:...
wmic computersystem where name="%computername%" set AutomaticManagedPagefile=False >nul 2>&1
wmic pagefilesetting delete >nul 2>&1
wmic pagefilesetting create name="C:\\pagefile.sys" >nul 2>&1
echo   -> Archivo de paginación bloqueado a la unidad C: (evita bloqueos por USBs/discos externos).
echo.

echo [2/4] Verificando la integridad del disco C: (escaneo rápido en caliente)...
chkdsk C: /scan
echo.

echo [3/4] Reparando la imagen del sistema de Windows (DISM)...
dism /online /cleanup-image /restorehealth
echo.

echo [4/4] Reparando archivos dañados del sistema (SFC)...
sfc /scannow
echo.

echo ========================================================
echo   ¡Mantenimiento completado con éxito!
echo ========================================================
echo.
pause
