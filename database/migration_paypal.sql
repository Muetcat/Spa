-- ── Migración: Agregar columnas de Pago a la tabla Reservas ──
USE susyestetic;

ALTER TABLE reservas 
ADD COLUMN metodo_pago VARCHAR(50) NOT NULL DEFAULT 'local',
ADD COLUMN estado_pago VARCHAR(50) NOT NULL DEFAULT 'pendiente',
ADD COLUMN paypal_order_id VARCHAR(100) NULL,
ADD COLUMN paypal_capture_id VARCHAR(100) NULL,
ADD COLUMN monto_pagado DECIMAL(8, 2) NOT NULL DEFAULT 0.00;
