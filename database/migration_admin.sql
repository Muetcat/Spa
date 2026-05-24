-- ============================================================
--  MIGRACIÓN: Soporte de Administrador
--  Ejecutar sobre la BD susyestetic existente
-- ============================================================

USE susyestetic;

-- 1. Añadir columna es_admin a la tabla clientes
ALTER TABLE clientes
  ADD COLUMN es_admin TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1 = administrador, 0 = cliente normal'
  AFTER notas_perfil;

-- 2. Crear usuario administrador por defecto
--    Correo: admin@suspa.com / Contraseña: Admin2026!
INSERT INTO clientes (nombre_completo, telefono, correo, password, es_admin, es_primera_visita)
VALUES (
  'Administrador SuSpa',
  '+593 098-497-0418',
  'admin@suspa.com',
  '$2y$10$ZHJy1QajzJgRJSO2vxqhjeVSehu3CZmLK7SpHbafMCievMe3GBLiu',
  1,
  0
);

-- Nota: La contraseña hasheada corresponde a "Admin2026!"
-- Si necesitas regenerarla, usa: php -r "echo password_hash('Admin2026!', PASSWORD_DEFAULT);"
