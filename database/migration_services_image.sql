-- ============================================================
--  MIGRACIÓN: Añadir imagen_ruta a servicios
--  Ejecutar sobre la BD susyestetic existente
-- ============================================================

USE susyestetic;

-- Añadir columna imagen_ruta si no existe
ALTER TABLE servicios
  ADD COLUMN imagen_ruta VARCHAR(255) NULL COMMENT 'Ruta de la imagen del servicio' AFTER descripcion;
