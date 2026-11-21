@echo off
title SERVIDOR DE SINCRONIZACION NEXUS POS - PUERTO 3008
color 0A
cd /d "C:\Users\JOSUE\Desktop\NEXUS_POS_ENTERPRISE"

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Solicitando permisos de Administrador para habilitar Firewall...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ==========================================================
echo   CONFIGURANDO FIREWALL Y SERVIDOR DE SINCRONIZACION (3008)
echo ==========================================================
echo.
netsh advfirewall firewall delete rule name="NEXUS_POS_3008" >nul 2>&1
netsh advfirewall firewall add rule name="NEXUS_POS_3008" dir=in action=allow protocol=TCP localport=3008 profile=any enable=yes >nul 2>&1
netsh advfirewall firewall add rule name="TITAN_POS_3000" dir=in action=allow protocol=TCP localport=3000 profile=any enable=yes >nul 2>&1
netsh advfirewall firewall add rule name="TITAN_POS_3001" dir=in action=allow protocol=TCP localport=3001 profile=any enable=yes >nul 2>&1
netsh advfirewall firewall delete rule name="all" program="C:\program files\nodejs\node.exe" >nul 2>&1
netsh advfirewall firewall add rule name="NODEJS_ALLOW_NEXUS" dir=in action=allow program="C:\program files\nodejs\node.exe" profile=any enable=yes >nul 2>&1

echo [OK] Puertos 3008, 3000, 3001 y Node.js autorizados en Firewall de Windows.
echo.
echo IP Servidor local: 192.168.100.38:3008
echo.
echo No cierres esta ventana mientras uses el punto de venta movil.
echo ==========================================================
echo.

node sync_server_3008.js
pause
