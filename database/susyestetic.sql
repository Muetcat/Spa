-- ============================================================
--  BASE DE DATOS: SusyEstetic — Salón de Belleza & Spa
--  Descripción : Esquema completo para gestionar servicios,
--                promociones, clientes, empleados y reservas
--  Motor       : MySQL 8.0+
--  Codificación: UTF-8 (utf8mb4)
--  Autor       : SusyEstetic Dev Team
--  Fecha       : 2026-04-21
-- ============================================================

-- ── Crear y seleccionar la base de datos ──────────────────────
CREATE DATABASE IF NOT EXISTS susyestetic
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;

USE susyestetic;

-- ── Desactivar restricciones temporalmente ────────────────────
SET FOREIGN_KEY_CHECKS = 0;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  TABLA: categorias                                       ║
-- ║  Guarda las categorías de servicios del spa              ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria    INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  clave           VARCHAR(30)    NOT NULL COMMENT 'Clave interna usada en el formulario (ej: facial, corporal)',
  nombre          VARCHAR(100)   NOT NULL COMMENT 'Nombre visible al cliente',
  descripcion     TEXT                    COMMENT 'Descripción breve de la categoría',
  icono_emoji     VARCHAR(10)             COMMENT 'Emoji decorativo para la interfaz',
  imagen_ruta     VARCHAR(255)            COMMENT 'Ruta relativa de la imagen hero de la categoría',
  url_pagina      VARCHAR(100)            COMMENT 'Nombre del archivo HTML de la categoría',
  activo          TINYINT(1)     NOT NULL DEFAULT 1 COMMENT '1 = visible, 0 = oculta',
  orden           TINYINT        UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Orden de aparición en el menú',
  fecha_creacion  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_categoria),
  UNIQUE KEY uq_clave (clave)
) ENGINE=InnoDB COMMENT='Categorías de servicios del spa';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  TABLA: servicios                                        ║
-- ║  Almacena cada tratamiento ofrecido por el spa           ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS servicios (
  id_servicio     INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  id_categoria    INT            UNSIGNED NOT NULL,
  nombre          VARCHAR(150)   NOT NULL COMMENT 'Nombre del tratamiento',
  descripcion     TEXT                    COMMENT 'Descripción detallada del servicio',
  duracion_min    SMALLINT       UNSIGNED NOT NULL DEFAULT 60 COMMENT 'Duración en minutos',
  precio          DECIMAL(8, 2)           COMMENT 'Precio base en dólares (NULL si es variable)',
  activo          TINYINT(1)     NOT NULL DEFAULT 1 COMMENT '1 = disponible, 0 = no disponible',
  es_destacado    TINYINT(1)     NOT NULL DEFAULT 0 COMMENT '1 = mostrar en la página de inicio',
  orden           TINYINT        UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Orden dentro de su categoría',
  fecha_creacion  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_servicio),
  CONSTRAINT fk_servicio_categoria
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Tratamientos y servicios individuales del spa';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  TABLA: promociones                                      ║
-- ║  Packs y descuentos especiales visibles en el sitio      ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS promociones (
  id_promocion      INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre            VARCHAR(150)   NOT NULL COMMENT 'Nombre del pack o promoción',
  descripcion       TEXT                    COMMENT 'Descripción completa de la promo',
  etiqueta_badge    VARCHAR(80)             COMMENT 'Texto del badge (ej: 💆 Más Popular)',
  precio_original   DECIMAL(8, 2)           COMMENT 'Precio antes del descuento',
  precio_oferta     DECIMAL(8, 2)           COMMENT 'Precio con descuento',
  porcentaje_dto    TINYINT        UNSIGNED  COMMENT 'Descuento en % (cuando no hay precio fijo)',
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  fecha_inicio      DATE                    COMMENT 'Inicio de vigencia (NULL = sin límite)',
  fecha_fin         DATE                    COMMENT 'Fin de vigencia (NULL = sin límite)',
  orden             TINYINT        UNSIGNED NOT NULL DEFAULT 0,
  fecha_creacion    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_promocion)
) ENGINE=InnoDB COMMENT='Promociones y packs especiales del spa';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  TABLA: promocion_servicios                              ║
-- ║  Relación N:M entre promociones y servicios incluidos    ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS promocion_servicios (
  id_promocion    INT  UNSIGNED NOT NULL,
  id_servicio     INT  UNSIGNED NOT NULL,
  descripcion_item VARCHAR(255)  COMMENT 'Texto descriptivo del ítem dentro del pack',
  PRIMARY KEY (id_promocion, id_servicio),
  CONSTRAINT fk_ps_promocion
    FOREIGN KEY (id_promocion) REFERENCES promociones(id_promocion)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ps_servicio
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Servicios que componen cada pack o promoción';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  TABLA: clientes                                         ║
-- ║  Datos personales de cada clienta registrada             ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente      INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_completo VARCHAR(150)   NOT NULL COMMENT 'Nombre y apellido de la clienta',
  telefono        VARCHAR(20)    NOT NULL COMMENT 'Número de contacto con código de país',
  correo          VARCHAR(150)             COMMENT 'Correo electrónico de contacto',
  notas_perfil    TEXT                     COMMENT 'Alergias, preferencias o condiciones especiales',
  es_primera_visita TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '1 = primera vez, 0 = clienta recurrente',
  fecha_registro  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_cliente),
  UNIQUE KEY uq_correo (correo)
) ENGINE=InnoDB COMMENT='Datos de clientes registradas';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  TABLA: empleadas                                        ║
-- ║  Especialistas y personal del spa                        ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS empleadas (
  id_empleada     INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_completo VARCHAR(150)   NOT NULL,
  especialidad    VARCHAR(150)            COMMENT 'Área principal de trabajo',
  telefono        VARCHAR(20),
  correo          VARCHAR(150),
  activa          TINYINT(1)     NOT NULL DEFAULT 1 COMMENT '1 = activa, 0 = baja',
  fecha_ingreso   DATE,
  fecha_creacion  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_empleada)
) ENGINE=InnoDB COMMENT='Especialistas y empleadas del spa';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  TABLA: horarios_disponibles                             ║
-- ║  Franjas de tiempo disponibles para reservas             ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS horarios_disponibles (
  id_horario      INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  hora_inicio     TIME           NOT NULL COMMENT 'Hora de inicio de la franja',
  hora_fin        TIME           NOT NULL COMMENT 'Hora de fin de la franja',
  franja          ENUM('mañana', 'mediodía', 'tarde') NOT NULL COMMENT 'Bloque del día',
  activo          TINYINT(1)     NOT NULL DEFAULT 1,
  PRIMARY KEY (id_horario),
  UNIQUE KEY uq_hora_inicio (hora_inicio)
) ENGINE=InnoDB COMMENT='Horarios disponibles para agendar citas';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  TABLA: reservas                                         ║
-- ║  Registro de cada cita agendada por las clientas         ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS reservas (
  id_reserva      INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente      INT            UNSIGNED NOT NULL,
  id_servicio     INT            UNSIGNED,
  id_promocion    INT            UNSIGNED  COMMENT 'Si la reserva es de un pack',
  id_horario      INT            UNSIGNED NOT NULL,
  id_empleada     INT            UNSIGNED  COMMENT 'Especialista asignada (puede asignarse después)',
  fecha_cita      DATE           NOT NULL COMMENT 'Fecha de la cita',
  notas_reserva   TEXT                    COMMENT 'Notas adicionales o solicitudes especiales',
  estado          ENUM(
                    'pendiente',
                    'confirmada',
                    'completada',
                    'cancelada',
                    'no_asistio'
                  )              NOT NULL DEFAULT 'pendiente',
  precio_cobrado  DECIMAL(8, 2)           COMMENT 'Precio real cobrado (puede diferir del base)',
  descuento_aplicado DECIMAL(8, 2) NOT NULL DEFAULT 0.00 COMMENT 'Monto de descuento aplicado',
  fecha_creacion  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_reserva),
  CONSTRAINT fk_reserva_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reserva_servicio
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reserva_promocion
    FOREIGN KEY (id_promocion) REFERENCES promociones(id_promocion)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reserva_horario
    FOREIGN KEY (id_horario) REFERENCES horarios_disponibles(id_horario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reserva_empleada
    FOREIGN KEY (id_empleada) REFERENCES empleadas(id_empleada)
    ON UPDATE CASCADE ON DELETE SET NULL,
  -- Un mismo horario y empleada no pueden tener dos reservas el mismo día
  UNIQUE KEY uq_cita_unica (fecha_cita, id_horario, id_empleada)
) ENGINE=InnoDB COMMENT='Citas y reservas de las clientas';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  TABLA: estadisticas_negocio                             ║
-- ║  Datos del negocio que se muestran en la barra de stats  ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS estadisticas_negocio (
  id_estadistica  INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  etiqueta        VARCHAR(100)   NOT NULL COMMENT 'Título visible, ej: Clientas satisfechas',
  valor           VARCHAR(20)    NOT NULL COMMENT 'Valor mostrado, ej: +500, 8+, 100%',
  orden           TINYINT        UNSIGNED NOT NULL DEFAULT 0,
  activo          TINYINT(1)     NOT NULL DEFAULT 1,
  PRIMARY KEY (id_estadistica)
) ENGINE=InnoDB COMMENT='Estadísticas del negocio para la página de inicio';


-- ╔══════════════════════════════════════════════════════════╗
-- ║  TABLA: configuracion_negocio                            ║
-- ║  Información general editable del negocio                ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS configuracion_negocio (
  clave           VARCHAR(80)    NOT NULL COMMENT 'Identificador único del campo',
  valor           TEXT           NOT NULL COMMENT 'Valor de la configuración',
  descripcion     VARCHAR(200)            COMMENT 'Explicación del campo para el administrador',
  PRIMARY KEY (clave)
) ENGINE=InnoDB COMMENT='Parámetros globales del negocio (nombre, contacto, horarios, etc.)';


-- ── Reactivar restricciones ───────────────────────────────────
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
--  DATOS INICIALES (SEED)
-- ============================================================

-- ── Categorías ────────────────────────────────────────────────
INSERT INTO categorias
  (clave, nombre, descripcion, icono_emoji, imagen_ruta, url_pagina, activo, orden)
VALUES
  ('facial',   'Tratamientos Faciales', 'Limpieza profunda, hidratación, anti-edad y más tratamientos para realzar tu piel.',               '🌸', 'images/facial-hero.jpg',   'facial.html',         1, 1),
  ('corporal', 'Tratamientos Corporales', 'Masajes, exfoliaciones y envolturas para renovar tu cuerpo de pies a cabeza.',                  '💆', 'images/corporal-hero.png', 'corporal.html',       1, 2),
  ('cejas',    'Cejas & Pestañas', 'Diseño, laminado, extensiones y lifting para una mirada perfecta e irresistible.',                     '👁️', 'images/cejas-hero.jpg',    'cejas-pestanas.html', 1, 3),
  ('promo',    'Packs & Promociones', 'Packs exclusivos y descuentos especiales para que disfrutes más ahorrando.',                        '🎁', 'images/promo-hero.png',    'promociones.html',    1, 4);


-- ── Servicios Faciales ────────────────────────────────────────
INSERT INTO servicios
  (id_categoria, nombre, descripcion, duracion_min, precio, activo, es_destacado, orden)
VALUES
  (1, 'Limpieza Facial Profunda',
   'Eliminamos impurezas, puntos negros y células muertas mediante una limpieza profunda con vapor y extracción profesional. Ideal para pieles grasas o mixtas. Incluye tónico, sérum y crema hidratante.',
   60, NULL, 1, 1, 1),

  (1, 'Hidratación Facial Intensiva',
   'Tratamiento de nutrición profunda con ácido hialurónico y vitamina C. Restaura la luminosidad y elasticidad de la piel. Perfecto para pieles secas o deshidratadas. Resultados visibles desde la primera sesión.',
   50, NULL, 1, 0, 2),

  (1, 'Tratamiento Anti-Edad',
   'Combina microdermoabrasión, sérum de retinol y mascarilla tensor para reducir líneas de expresión y manchas. Estimula la producción de colágeno y devuelve la firmeza a la piel madura.',
   75, NULL, 1, 0, 3),

  (1, 'Peeling Químico',
   'Exfoliación química controlada con ácidos frutales (AHA/BHA) que renueva la superficie de la piel, mejora la textura, unifica el tono y trata manchas y cicatrices de acné. Incluye post-tratamiento calmante.',
   45, NULL, 1, 0, 4),

  (1, 'Mascarilla Iluminadora Gold',
   'Lujosa mascarilla con extracto de oro coloidal, vitamina E y perla marina. Aporta un resplandor inmediato y sensación de terciopelo en la piel. Ideal como tratamiento previo a un evento especial.',
   40, NULL, 1, 0, 5),

  (1, 'Tratamiento para Acné',
   'Protocolo especializado con luz LED azul, ácido salicílico y mascarilla con árbol de té para controlar el acné activo, reducir la inflamación y prevenir nuevos brotes. Apto para pieles sensibles y adolescentes.',
   55, NULL, 1, 0, 6);


-- ── Servicios Corporales ──────────────────────────────────────
INSERT INTO servicios
  (id_categoria, nombre, descripcion, duracion_min, precio, activo, es_destacado, orden)
VALUES
  (2, 'Masaje Relajante',
   'Masaje de cuerpo completo con aceites esenciales aromaterapéuticos de lavanda y rosa. Técnicas suaves de effleurage y petrissage para liberar el estrés acumulado y promover un estado de calma profunda.',
   60, NULL, 1, 1, 1),

  (2, 'Masaje Descontracturante',
   'Técnica de presión profunda enfocada en contracturas musculares y zonas de tensión crónica (cuello, espalda y hombros). Combina digitopresión y maniobras de fricción para liberar nudos musculares. Recomendado para personas activas y deportistas.',
   75, NULL, 1, 0, 2),

  (2, 'Masaje con Piedras Calientes',
   'Terapia milenaria que combina el calor de las piedras de basalto volcánico con aceites esenciales. El calor penetra en los músculos mejorando la circulación sanguínea, aliviando el dolor articular y produciendo una relajación profunda incomparable.',
   90, NULL, 1, 0, 3),

  (2, 'Exfoliación Corporal Premium',
   'Tratamiento de renovación celular con exfoliante de sal marina, azúcar de caña y aceite de argán. Elimina células muertas, suaviza y nutre la piel en profundidad. Finaliza con aplicación de mantequilla de karité para una hidratación duradera.',
   45, NULL, 1, 0, 4),

  (2, 'Envoltura Reductora',
   'Tratamiento corporal con barro de arcilla verde enriquecido con cafeína y algas marinas. Activa la circulación, reduce la apariencia de celulitis y ayuda a modelar la silueta. Se aplica con técnica de vendaje caliente para maximizar resultados.',
   60, NULL, 1, 0, 5),

  (2, 'Drenaje Linfático Manual',
   'Técnica especializada de presión rítmica y suave que estimula el sistema linfático para eliminar toxinas, reducir la retención de líquidos y aliviar la sensación de pesadez. Ideal en postoperatorio o para piernas cansadas y edemas. Certificación Vodder.',
   60, NULL, 1, 0, 6);


-- ── Servicios de Cejas & Pestañas ─────────────────────────────
INSERT INTO servicios
  (id_categoria, nombre, descripcion, duracion_min, precio, activo, es_destacado, orden)
VALUES
  (3, 'Diseño de Cejas',
   'Diseño personalizado según la estructura facial de la clienta. Incluye depilación con hilo y cera, definición del arco y tinte para mayor expresividad.',
   30, NULL, 1, 0, 1),

  (3, 'Laminado de Cejas',
   'Técnica que alisa y fija los vellos de la ceja en la dirección deseada, creando un efecto de cejas más gruesas, uniformes y definidas durante 4 a 8 semanas.',
   45, NULL, 1, 0, 2),

  (3, 'Extensión de Pestañas Clásica',
   'Aplicación de extensiones sintéticas pelo a pelo para un look natural y elegante. Aumenta el volumen y la longitud de tus pestañas de forma cómoda y duradera (3 a 4 semanas).',
   90, NULL, 1, 1, 3),

  (3, 'Extensión de Pestañas Volumen',
   'Técnica fanmaker de 2D a 6D que crea un efecto dramático y lleno para quienes buscan mayor densidad. Las extensiones en abanico aportan un look espectacular de larga duración.',
   120, NULL, 1, 0, 4),

  (3, 'Lifting de Pestañas',
   'Permanente que riza y eleva la pestaña natural desde la raíz, dando la ilusión de pestañas más largas sin extensiones. Ideal para pieles sensibles. Duración de 6 a 8 semanas.',
   60, NULL, 1, 0, 5),

  (3, 'Tinte de Cejas y Pestañas',
   'Coloración semipermanente que intensifica el color de cejas y pestañas para una mirada más definida sin maquillaje. Dura entre 3 y 5 semanas según el tipo de cabello.',
   30, NULL, 1, 0, 6);


-- ── Promociones ───────────────────────────────────────────────
INSERT INTO promociones
  (nombre, descripcion, etiqueta_badge, precio_original, precio_oferta, porcentaje_dto, activo, fecha_inicio, fecha_fin, orden)
VALUES
  ('Primera Visita',
   'Si es tu primera vez en SuSpa, te damos la bienvenida con un descuento especial del 20% en cualquier servicio individual de tu elección.',
   '🌸 Nuevo Cliente', NULL, NULL, 20, 1, NULL, NULL, 1),

  ('Pack Relajación Total',
   'La combinación perfecta para liberar el estrés y renovar tu energía. Masaje relajante + facial hidratante en una sesión de bienestar completo.',
   '💆 Más Popular', 180.00, 135.00, NULL, 1, NULL, NULL, 2),

  ('Pack Novia Completo',
   'Para el día más importante de tu vida. Un paquete integral que te dejará radiante de pies a cabeza para tu boda o evento especial.',
   '💍 Novias', 290.00, 220.00, NULL, 1, NULL, NULL, 3),

  ('Pack Corporal Completo',
   'La experiencia corporal definitiva para quienes quieren modelar, nutrir y rejuvenecer su piel en una sola visita de lujo.',
   '✨ Premium', 240.00, 185.00, NULL, 1, NULL, NULL, 4);


-- ── Servicios incluidos en cada pack ──────────────────────────
-- Pack Relajación Total (id_promocion = 2) incluye:
--   Masaje Relajante (id_servicio = 7) + Limpieza Facial Profunda (id_servicio = 1)
INSERT INTO promocion_servicios (id_promocion, id_servicio, descripcion_item) VALUES
  (2, 7, 'Masaje Relajante (60 min)'),
  (2, 1, 'Limpieza Facial Profunda (60 min)');

-- Pack Novia Completo (id_promocion = 3) incluye:
--   Diseño de Cejas (13) + Extensión Clásica (15) + Limpieza Facial (1) + Exfoliación (10)
INSERT INTO promocion_servicios (id_promocion, id_servicio, descripcion_item) VALUES
  (3, 13, 'Diseño y tinte de cejas'),
  (3, 15, 'Extensión de pestañas clásica'),
  (3, 1,  'Limpieza facial + mascarilla iluminadora'),
  (3, 10, 'Exfoliación corporal');

-- Pack Corporal Completo (id_promocion = 4) incluye:
--   Exfoliación (10) + Envoltura (11) + Masaje Descontracturante (8) + Drenaje (12)
INSERT INTO promocion_servicios (id_promocion, id_servicio, descripcion_item) VALUES
  (4, 10, 'Exfoliación corporal premium'),
  (4, 11, 'Envoltura reductora de arcilla'),
  (4, 8,  'Masaje descontracturante (60 min)'),
  (4, 12, 'Drenaje linfático (30 min)');


-- ── Horarios disponibles ──────────────────────────────────────
INSERT INTO horarios_disponibles (hora_inicio, hora_fin, franja, activo) VALUES
  ('09:00', '10:00', 'mañana',   1),
  ('09:30', '10:30', 'mañana',   1),
  ('10:00', '11:00', 'mañana',   1),
  ('10:30', '11:30', 'mañana',   1),
  ('11:00', '12:00', 'mañana',   1),
  ('11:30', '12:30', 'mañana',   1),
  ('12:00', '13:00', 'mediodía', 1),
  ('12:30', '13:30', 'mediodía', 1),
  ('13:00', '14:00', 'mediodía', 1),
  ('13:30', '14:30', 'mediodía', 1),
  ('14:00', '15:00', 'mediodía', 1),
  ('14:30', '15:30', 'mediodía', 1),
  ('15:00', '16:00', 'tarde',    1),
  ('15:30', '16:30', 'tarde',    1),
  ('16:00', '17:00', 'tarde',    1),
  ('16:30', '17:30', 'tarde',    1),
  ('17:00', '18:00', 'tarde',    1),
  ('17:30', '18:30', 'tarde',    1),
  ('18:00', '19:00', 'tarde',    1),
  ('18:30', '19:30', 'tarde',    1);


-- ── Estadísticas del negocio ──────────────────────────────────
INSERT INTO estadisticas_negocio (etiqueta, valor, orden, activo) VALUES
  ('Clientas satisfechas', '+500', 1, 1),
  ('Años de experiencia',  '8+',   2, 1),
  ('Tratamientos premium', '20+',  3, 1),
  ('Productos naturales',  '100%', 4, 1);


-- ── Configuración general del negocio ─────────────────────────
INSERT INTO configuracion_negocio (clave, valor, descripcion) VALUES
  ('nombre_negocio',       'SusyEstetic',                     'Nombre comercial del spa'),
  ('eslogan',              'Donde la belleza encuentra la calma', 'Eslogan principal'),
  ('direccion',            'Bolivar y Cesar Abel Pazmiño, San Miguel de Bolivar, Ecuador', 'Dirección física del local'),
  ('telefono',             '+593 098-497-0418',               'Teléfono principal de contacto'),
  ('whatsapp',             '+593968951312',                   'Número de WhatsApp para contacto directo'),
  ('correo',               'spa@suspa.com',                   'Correo electrónico de contacto'),
  ('instagram_url',        'https://instagram.com',           'URL del perfil de Instagram'),
  ('facebook_url',         'https://facebook.com',            'URL del perfil de Facebook'),
  ('horario_lunes_viernes','9:00 – 19:00',                    'Horario de atención de lunes a viernes'),
  ('horario_sabado',       '9:00 – 17:00',                    'Horario de atención el sábado'),
  ('horario_domingo',      'Cerrado',                         'Estado del negocio los domingos'),
  ('descuento_primera_visita', '20',                          'Porcentaje de descuento para clientas nuevas'),
  ('horas_confirmacion',   '24',                              'Horas máximas para confirmar una reserva'),
  ('horas_cancelacion_minima', '4',                           'Horas mínimas de anticipación para cancelar sin penalidad'),
  ('año_fundacion',        '2018',                            'Año de apertura del negocio');


-- ============================================================
--  VISTAS ÚTILES PARA EL FRONTEND
-- ============================================================

-- ── Vista: servicios con su categoría ────────────────────────
CREATE OR REPLACE VIEW vista_servicios_completos AS
SELECT
  s.id_servicio,
  c.clave              AS clave_categoria,
  c.nombre             AS nombre_categoria,
  s.nombre             AS nombre_servicio,
  s.descripcion,
  s.duracion_min,
  s.precio,
  s.es_destacado,
  s.orden
FROM servicios s
JOIN categorias c ON s.id_categoria = c.id_categoria
WHERE s.activo = 1
  AND c.activo = 1
ORDER BY c.orden, s.orden;


-- ── Vista: promociones activas con sus ítems ─────────────────
CREATE OR REPLACE VIEW vista_promociones_activas AS
SELECT
  p.id_promocion,
  p.nombre,
  p.descripcion,
  p.etiqueta_badge,
  p.precio_original,
  p.precio_oferta,
  p.porcentaje_dto,
  p.fecha_inicio,
  p.fecha_fin,
  p.orden
FROM promociones p
WHERE p.activo = 1
  AND (p.fecha_inicio IS NULL OR p.fecha_inicio <= CURDATE())
  AND (p.fecha_fin IS NULL    OR p.fecha_fin >= CURDATE())
ORDER BY p.orden;


-- ── Vista: reservas detalladas para el panel admin ───────────
CREATE OR REPLACE VIEW vista_reservas_detalle AS
SELECT
  r.id_reserva,
  r.fecha_cita,
  h.hora_inicio,
  h.franja,
  cl.nombre_completo  AS nombre_cliente,
  cl.telefono         AS telefono_cliente,
  cl.correo           AS correo_cliente,
  s.nombre            AS nombre_servicio,
  pr.nombre           AS nombre_promocion,
  e.nombre_completo   AS nombre_empleada,
  r.estado,
  r.precio_cobrado,
  r.descuento_aplicado,
  r.notas_reserva,
  r.fecha_creacion
FROM reservas r
JOIN clientes              cl ON r.id_cliente   = cl.id_cliente
JOIN horarios_disponibles  h  ON r.id_horario   = h.id_horario
LEFT JOIN servicios        s  ON r.id_servicio  = s.id_servicio
LEFT JOIN promociones      pr ON r.id_promocion = pr.id_promocion
LEFT JOIN empleadas        e  ON r.id_empleada  = e.id_empleada
ORDER BY r.fecha_cita DESC, h.hora_inicio;


-- ============================================================
--  FIN DEL SCRIPT
-- ============================================================
