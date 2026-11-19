# NEXUS POS ENTERPRISE 🚀

Este es el ecosistema de próxima generación diseñado para procesar millones de transacciones sin congelarse.

## Estructura Inicial
- **`servidor_central/main.go`**: El código del servidor escrito en Go. Este código utiliza "Workers" y "Canales" (colas en memoria) para recibir miles de ventas por segundo sin hacer esperar a las cajas.
- **`base_de_datos/schema.sql`**: El esquema relacional real (diseñado para PostgreSQL). Utiliza UUIDs para que si 3,000 sucursales crean ventas sin internet al mismo tiempo, nunca haya choques de ID al sincronizar.

## Siguientes Pasos (Elige cuál quieres ver primero):

1. **Compilar y probar el servidor central (Go)**: Verás en la consola cómo puede recibir ventas masivas al instante.
2. **Crear la aplicación de la Caja (Frontend)**: Crear el esqueleto en React/Tailwind para tener una UI ultrarrápida.
3. **Integrar SQLite local**: Escribir el código en Rust (Tauri) o Node para guardar las ventas de forma blindada cuando no hay internet.
