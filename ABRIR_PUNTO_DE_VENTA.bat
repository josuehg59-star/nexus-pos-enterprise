@echo off
title NEXUS POS ENTERPRISE - INICIAR SISTEMA LOCAL
color 0A
cls
echo ======================================================================
echo             NEXUS POS ENTERPRISE - CAJA LOCAL AUTOMÁTICA
echo ======================================================================
echo.
echo  Iniciando servidor local del Punto de Venta...
echo.

cd /d "C:\Users\JOSUE\Desktop\NEXUS_POS_ENTERPRISE\caja_local\frontend"

if not exist node_modules (
    echo  [!] Instalando dependencias necesarias...
    call npm install
)

echo  [✓] Levantando sistema en http://localhost:5173...
start http://localhost:5173

echo.
echo  ======================================================================
echo  SISTEMA EN EJECUCIÓN (Mantén esta ventana abierta mientras usas el POS)
echo  ======================================================================
echo.

call npm run dev
