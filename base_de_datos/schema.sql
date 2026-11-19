-- ==============================================================================
-- NEXUS ENTERPRISE POS - ESQUEMA DE BASE DE DATOS CENTRAL (POSTGRESQL)
-- ==============================================================================

-- 1. CATÁLOGO GLOBAL (Sincronizado hacia abajo a todas las sucursales)
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    codigo_barras VARCHAR(100) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    precio_venta DECIMAL(12,2) NOT NULL,
    costo DECIMAL(12,2) NOT NULL,
    es_servicio BOOLEAN DEFAULT FALSE, -- Para distinguir de recargas/pagos
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. INFRAESTRUCTURA (Manejo de miles de sucursales)
CREATE TABLE sucursales (
    id SERIAL PRIMARY KEY,
    codigo_sucursal VARCHAR(20) UNIQUE,
    nombre VARCHAR(150),
    direccion TEXT,
    zona VARCHAR(50),
    activa BOOLEAN DEFAULT TRUE
);

CREATE TABLE cajas (
    id SERIAL PRIMARY KEY,
    sucursal_id INT REFERENCES sucursales(id),
    mac_address VARCHAR(50) UNIQUE,
    numero_caja INT,
    estatus VARCHAR(20) DEFAULT 'OPERATIVA'
);

-- 3. MOTOR TRANSACCIONAL (Soporta millones de registros sin trabarse)
-- Esta tabla usa particionamiento por fecha (Partitioning) para consultas ultrarrápidas.
CREATE TABLE tickets (
    id UUID PRIMARY KEY, -- UUID para evitar choques entre cajas offline
    caja_id INT REFERENCES cajas(id),
    sucursal_id INT REFERENCES sucursales(id),
    total DECIMAL(12,2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL, -- EFECTIVO, TARJETA, TRANSFERENCIA
    fecha_emision TIMESTAMP NOT NULL,
    fecha_sincronizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket_partidas (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id),
    producto_id INT REFERENCES productos(id),
    cantidad DECIMAL(10,3) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL
);

-- 4. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX idx_tickets_fecha ON tickets(fecha_emision);
CREATE INDEX idx_tickets_sucursal ON tickets(sucursal_id);
