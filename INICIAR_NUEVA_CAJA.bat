@echo off
echo ===================================================
echo Iniciando Interfaz de Caja (NEXUS POS ENTERPRISE)
echo ===================================================
cd caja_local\frontend
echo Instalando dependencias necesarias (esto solo toma unos segundos la primera vez)...
call npm install
echo Levantando servidor de desarrollo...
start http://localhost:5173
call npm run dev
