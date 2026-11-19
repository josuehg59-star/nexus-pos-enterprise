@echo off
title HABILITAR PUERTOS TITAN POS (3000 Y 3001)
color 0b
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] POR FAVOR, EJECUTA ESTE ARCHIVO DANDO CLIC DERECHO
    echo         Y SELECCIONANDO "EJECUTAR COMO ADMINISTRADOR".
    echo.
    pause
    exit
)

echo.
echo =======================================================
echo   HABILITANDO PUERTOS EN EL FIREWALL PARA REMOTO POS
echo =======================================================
echo.

echo [+] Eliminando reglas antiguas si existen...
netsh advfirewall firewall delete rule name="TITAN_POS_3000" >nul 2>&1
netsh advfirewall firewall delete rule name="TITAN_POS_3001" >nul 2>&1

echo [+] Habilitando Puerto 3000 (Base de datos y Sincronizacion)...
netsh advfirewall firewall add rule name="TITAN_POS_3000" dir=in action=allow protocol=TCP localport=3000 profile=any enable=yes

echo [+] Habilitando Puerto 3008 (Sincronizacion Universal Nexus POS)...
netsh advfirewall firewall add rule name="NEXUS_POS_3008" dir=in action=allow protocol=TCP localport=3008 profile=any enable=yes

echo [+] Habilitando Puerto 3001 (Servidor de Interfaz Web Móvil)...
netsh advfirewall firewall add rule name="TITAN_POS_3001" dir=in action=allow protocol=TCP localport=3001 profile=any enable=yes

echo.
echo =======================================================
echo   [OK] !PUERTOS 3000 Y 3001 CONFIGURADOS CON EXITO!
echo =======================================================
echo.
echo Ahora tu celular podra sincronizar y conectarse sin bloqueos.
echo.
pause
