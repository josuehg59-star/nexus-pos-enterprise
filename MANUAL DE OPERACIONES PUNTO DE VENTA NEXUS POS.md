Para configurar a un empleado para que solo cobre en Caja, pueda dar entradas de mercancía o procesar devoluciones, pero NO modifique precios, ni vea reportes financieros, ni cambie la configuración del sistema:



Paso 1: Crear o Asignar el Empleado en la PC

En el menú lateral izquierdo de tu Punto de Venta, ve a CONFIGURACIÓN.

Baja a la sección "GESTIÓN DE TERMINALES Y USUARIOS / CAJEROS".

En el apartado "AGREGAR NUEVO USUARIO":

Nombre: Escribe el nombre del empleado (ej. JUAN).

Rol: Selecciona CAJERO.

PIN: Asigna un PIN numérico de 4 dígitos (ej. 2580).

Clic en el botón azul + CAJERO.



(Asegúrate de que tu usuario principal tenga rol ADMINISTRADOR con un PIN que solo tú conozcas, ej. 1234 o el tuyo).



Paso 2: ¿Cómo opera el empleado en su turno?

En la pantalla de cobro (Terminal POS), en la parte superior derecha donde aparece el nombre del cajero:

Haz clic sobre el nombre y selecciona a JUAN (CAJERO).

Lo que SÍ puede hacer el Cajero:

🛒 Cobrar en Terminal POS: Escanear, cobrar en efectivo/tarjeta, emitir tickets.

📦 Dar Entradas de Mercancía: Puede ir a Inventario > Entradas para registrar compras de proveedores y sumar stock al inventario.

🔄 Devoluciones de Mercancía:

A Proveedor: Desde la misma pantalla de Entradas seleccionando el botón naranja DEVOLUCIÓN.

De Clientes: Desde el historial de folios/tickets en caja.

Lo que queda BLOQUEADO para el Cajero:

🔒 Configuración: Si intenta entrar a Configuración, el sistema le pide el PIN de Administrador.

🔒 Catálogo Maestro: No puede cambiar precios ni borrar productos.

🔒 Dashboard BI y Métricas: No puede ver ganancias globales ni reportes confidenciales sin tu PIN.









📖 **MANUAL OPERATIVO PARA EL PERSONAL**

1\. 🟢 Inicio de Turno (Abrir Caja)

Al comenzar el día, en la pantalla principal de cobro, verificar en la esquina superior derecha que esté seleccionado su nombre de Cajero.

Si la caja solicita fondo inicial, ingresar el dinero en efectivo con el que se arranca la caja (cambio).

2\. 🛒 Proceso de Cobro (Venta Diaria)

Escanear Producto:

Pasar el código de barras con el lector.

Si un producto no tiene código, se puede buscar escribiendo su nombre en la barra de búsqueda.

Multiplicar Cantidad:

Si el cliente lleva varias piezas del mismo producto, presionar la tecla \* o escribir la cantidad antes o después del código (ej. 5 \* Código).

Cobrar y Finalizar:

Presionar el botón verde COBRAR (o la tecla rápida de cobro).

Indicar la forma de pago:

Efectivo: Escribir con cuánto paga el cliente; la pantalla calcula y muestra el cambio exacto.

Tarjeta / Transferencia: Seleccionar la opción correspondiente.

El ticket se imprime o registra y la venta queda completada.

3\. 📦 Entradas de Mercancía (Llegada de Proveedores)



Cuando llegue mercancía de un proveedor para surtir la tienda:



Ir al menú izquierdo: Inventario > Entradas.

Escribir el nombre del proveedor o número de nota/factura.

Escanear o buscar cada producto que llegó.

Poner la cantidad exacta recibida y confirmar.

Presionar GUARDAR ENTRADA.

El sistema sumará automáticamente las piezas al stock de la tienda.

4\. 🔄 Devoluciones de Mercancía

A) Devolución de un Cliente (Producto regresado):

Ir a la sección de Ventas / Folios en caja.

Buscar el ticket con el número de folio de la compra.

Seleccionar el producto que regresa el cliente y procesar la Devolución.

El sistema regresa el producto al inventario y resta el dinero de la caja.

B) Devolución a Proveedor (Producto caducado, dañado o cancelado):

Ir a Inventario > Entradas.

Cambiar el tipo de movimiento al botón naranja DEVOLUCIÓN.

Escanear el producto y poner la cantidad devuelta al repartidor.

El sistema restará esas piezas del inventario para mantener el stock real.

5\. 📱 Uso de la App en el Celular (Ventas Móviles y Auditoría)

Ventas Rápidas / Fila Larga:

Si hay mucha gente, el encargado puede cobrar o despachar directamente desde el celular escaneando con la cámara.

Auditoría de Inventario (Conteo físico):

Entrar al módulo de Auditoría.

Se puede buscar por nombre, código o proveedor con la nueva Multibúsqueda.

Cuenta con Autoguardado: si el celular se bloquea o entra una llamada, el conteo no se pierde.

Se pueden sumar cantidades directas (+1, +5, +10, +50 o teclado numérico).

Al terminar, presionar Aplicar Auditoría para ajustar el inventario.

6\. ⚡ ¿Qué hacer si se va la luz?

En la PC: Se apagará normalmente.

En el Celular: ¡Sigan cobrando sin miedo! La app del celular tiene memoria interna independiente. Seguirá registrando cada venta y cada folio.

Al regresar la luz:

Encender la PC (la ventana de sincronización abrirá sola).

En cuanto el celular detecte la red WiFi, enviará todas las ventas y auditorías a la PC de forma automática y transparente.

7\. 🔒 Seguridad y Permisos

Los cajeros tienen acceso libre para cobrar, registrar entradas de mercancía y hacer devoluciones.

Las áreas sensibles como Precios, Ganancias del Negocio y Configuración del Sistema están bloqueadas con candado y solo el Administrador puede autorizarlas con su PIN.













Aquí tienes el Manual Completo para el Administrador / Dueño, con todos los procesos clave para controlar, auditar y gestionar el negocio al 100%:



**👑 MANUAL MAESTRO DE ADMINISTRACIÓN (NEXUS POS)**

1\. 🔐 Seguridad, PIN y Control de Cajeros



Como Administrador tienes el control total y acceso sin restricciones.



Dónde se configura: Menú lateral > Configuración > sección "Gestión de Terminales y Cajeros".

Tu PIN Maestro: Debe ser un código que solo tú conozcas (por defecto 1234 o el que hayas asignado).

Control de Cajeros:

Cuando un empleado con rol CAJERO intente ver ganancias, modificar precios en el catálogo o entrar a la configuración, la pantalla le exigirá tu PIN de Administrador.

Si un cajero necesita un permiso especial en un momento puntual (por ejemplo, corregir un precio), puedes acercarte y escribir tu PIN sin necesidad de cerrar su turno.

2\. 🏷️ Catálogo Maestro de Productos (Precios y Costos)

Dónde se encuentra: Menú lateral > Inventario > Catálogo Maestro.

Procesos clave:

Dar de alta un producto nuevo: Ingresar Código de barras, Nombre, Precio de Costo, Precio de Venta y Stock inicial.

Margen de Ganancia: El sistema calcula automáticamente el porcentaje de ganancia según el costo y precio de venta.

Modificación masiva o por producto: Cambiar precios de venta, precios de mayoreo o cantidades mínimas para alerta de stock bajo.

Impresión de Etiquetas: En Inventario > Impresión Etiquetas puedes imprimir códigos de barras y etiquetas de anaquel para los productos.

3\. 📊 Auditoría y Control de Inventario (KARDEX)



El sistema cuenta con un historial contable estricto para que nunca se "pierda" mercancía sin explicación.



Kardex en Vivo: Menú lateral > Inventario > Kardex.

Te muestra el historial detallado de cada producto: quién, a qué hora, por qué motivo y con qué folio se movió una pieza (Venta en PC, Venta en Celular, Entrada por compra, Merma o Devolución).

Auditorías Físicas (Cierre de Inventario):

Puedes mandar a hacer conteo físico con el celular o desde la PC.

El sistema compara lo que debería haber en sistema contra lo que se contó físicamente.

Si hay faltantes o sobrantes, se genera un folio oficial de ajuste (AUD-CEL-...) para cuadrar el inventario real.

4\. 💰 Corte de Caja, Arqueos y Cierre Z

Dónde se encuentra: Menú lateral > Operación > Arqueos y Caja Z.

Proceso al final del día o cambio de turno:

Ver el total vendido desglosado por: Efectivo, Tarjeta, Transferencias y Créditos.

Ver el dinero con el que se abrió caja (fondo) y las entradas/salidas de efectivo registradas.

Contar el dinero en el cajón y realizar el Corte Z.

El sistema detecta si hay sobrante o faltante de dinero con respecto a los tickets cobrados.

5\. 📈 Inteligencia de Negocio y Reportes (Dashboard BI)

Dónde se encuentra: Menú lateral > Dashboard BI y Reportes.

Información para la toma de decisiones:

Ventas Totales del Día / Mes / Año.

Ganancia Neta Real: (Venta total menos el costo de compra de la mercancía).

Productos Estrella: Los artículos más vendidos y los que más utilidad dejan.

Productos Lentos / Hueso: Mercancía estancada que no se mueve y requiere promociones.

Horas pico: En qué horarios hay mayor flujo de clientes para planear turnos de personal.

6\. 📱 Supervisión de Sincronización Móvil (Puerto 3008)

La ventana negra del servidor (Puerto 3008) corre en segundo plano en la PC:

En ella ves en tiempo real cuando el celular consulta catálogo, cobra una venta o aplica un ajuste de inventario.

Ventas Offline (Cuando se va la luz): Si hubo corte de energía, al encender la PC verás en esa ventana cómo llegan las ventas acumuladas del celular con su folio y hora exacta, garantizando que el dinero y el stock cuadren sin pérdida de información.

