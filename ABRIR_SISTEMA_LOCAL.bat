@echo off
title NEXUS POS ENTERPRISE - PUNTO DE VENTA LOCAL
color 0A
cls
echo ======================================================================
echo             NEXUS POS ENTERPRISE - CAJA LOCAL AUTOMÁTICA
echo ======================================================================
echo.
echo  Iniciando servidor local del Punto de Venta...
echo.

cd /d "%~dp0caja_local\frontend"

if not exist node_modules (
    echo  [!] Instalando paquetes y dependencias iniciales...
    call npm install
)

echo  [✓] Iniciando servidor de sincronización móvil en puerto 3008...
start /b node "%~dp0sync_server_3008.js" >nul 2>&1

echo  [✓] Abriendo navegador en http://localhost:5173...
start http://localhost:5173

echo.
echo  ======================================================================
echo  SISTEMA EN EJECUCIÓN (No cierres esta ventana mientras usas el POS)
echo  ======================================================================
echo.

call npm run dev
