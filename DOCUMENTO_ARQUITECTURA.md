# MANIFIESTO DE ARQUITECTURA - NEXUS POS ENTERPRISE 🚀

Este documento establece las reglas inquebrantables de la arquitectura del sistema para garantizar el soporte de 3,000 sucursales, 30,000 cajas y 3,000,000 de tickets por hora.

## 1. Las Cajas (El Frente de Batalla)
Las cajas no pueden depender del internet para vender. Si el internet de la sucursal se cae, la caja debe seguir cobrando a 100 tickets por hora sin inmutarse.
- **Tecnología:** Tauri (Rust) + React.
- **Base de datos:** SQLite Nativo local.
- **Mecánica:** La caja cobra y guarda en su SQLite. Un proceso invisible en segundo plano toma esos tickets y los mete a una "caja de envíos" (Cola local). Tan pronto detecta internet, los dispara a la nube.

## 2. La Trastienda (El Cerebro de la Sucursal)
Con 10 cajas, no quieres que las 10 descarguen el mismo catálogo de 50,000 productos desde la nube al mismo tiempo (saturaría el internet local).
- **Tecnología:** Un pequeño servicio en Node.js o Go (Golang) corriendo en la PC del gerente.
- **Mecánica:** La Nube central actualiza los precios y se los envía solo a la Trastienda. La Trastienda se encarga de repartir los precios a las 10 cajas por la red local (LAN) a velocidad luz.

## 3. El "Único Servidor" (El Núcleo en la Nube)
Para recibir 833 transacciones por segundo sin que el servidor explote, no podemos mandar los datos directo a la base de datos. Usamos la "Técnica del Embudo":
- **El Receptor (API):** Microservicios escritos en Go (Golang) o Rust. Go está diseñado por Google específicamente para manejar cientos de miles de conexiones simultáneas usando muy poca memoria.
- **El Amortiguador (Apache Kafka):** El secreto de los grandes. Cuando las 30,000 cajas envían tickets al mismo tiempo, Kafka los atrapa todos en el aire en milisegundos y los forma en una fila india perfecta.
- **La Base de Datos Central:** PostgreSQL o CockroachDB (una base de datos diseñada para ser indestructible y distribuida). PostgreSQL irá tomando los tickets de Kafka a su propio ritmo seguro y guardándolos permanentemente.

## 4. Integraciones (Recargas, Servicios y Retiros de Efectivo)
A diferencia de vender unas papas (que puede ser offline), los servicios y retiros bancarios requieren validación en tiempo real (para evitar fraudes o doble retiro).
- **Arquitectura Híbrida:** Cuando escanean un producto normal, va al SQLite local (Offline). Cuando seleccionan "Retiro de Efectivo" o "Recarga Telcel", el sistema cambia a modo Transacción Estricta (ACID). Hace un túnel seguro cifrado (gRPC / TLS) directo al servidor central para validar si hay saldo, descuenta y autoriza, todo en menos de 1.5 segundos.
