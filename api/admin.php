<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

/* ── Verificar que sea administrador ──────────────────── */
if (!isset($_SESSION['user_id']) || empty($_SESSION['is_admin'])) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Acceso denegado. Se requiere permisos de administrador.']);
    exit;
}

$pdo    = getDB();
$input  = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? ($_POST['action'] ?? ($_GET['action'] ?? ''));

if (!$action) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Acción no especificada.']);
    exit;
}

try {

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════ */
if ($action === 'get_dashboard') {

    $stats = [];

    // Total servicios activos
    $stmt = $pdo->query('SELECT COUNT(*) AS total FROM servicios WHERE activo = 1');
    $stats['servicios_activos'] = (int) $stmt->fetch()['total'];

    // Total categorías activas
    $stmt = $pdo->query('SELECT COUNT(*) AS total FROM categorias WHERE activo = 1');
    $stats['categorias_activas'] = (int) $stmt->fetch()['total'];

    // Reservas pendientes
    $stmt = $pdo->query("SELECT COUNT(*) AS total FROM reservas WHERE estado = 'pendiente'");
    $stats['reservas_pendientes'] = (int) $stmt->fetch()['total'];

    // Reservas de hoy
    $stmt = $pdo->prepare("SELECT COUNT(*) AS total FROM reservas WHERE fecha_cita = CURDATE() AND estado IN ('pendiente','confirmada')");
    $stmt->execute();
    $stats['reservas_hoy'] = (int) $stmt->fetch()['total'];

    // Total clientes
    $stmt = $pdo->query('SELECT COUNT(*) AS total FROM clientes WHERE es_admin = 0');
    $stats['total_clientes'] = (int) $stmt->fetch()['total'];

    // Promociones activas
    $stmt = $pdo->query('SELECT COUNT(*) AS total FROM promociones WHERE activo = 1');
    $stats['promos_activas'] = (int) $stmt->fetch()['total'];

    // Total reservas completadas este mes
    $stmt = $pdo->query("SELECT COUNT(*) AS total FROM reservas WHERE estado = 'completada' AND MONTH(fecha_cita) = MONTH(CURDATE()) AND YEAR(fecha_cita) = YEAR(CURDATE())");
    $stats['completadas_mes'] = (int) $stmt->fetch()['total'];

    // Reservas recientes (últimas 5)
    $stmt = $pdo->query("
        SELECT r.id_reserva, r.fecha_cita, r.estado,
               cl.nombre_completo AS cliente,
               COALESCE(s.nombre, p.nombre) AS servicio
        FROM reservas r
        JOIN clientes cl ON r.id_cliente = cl.id_cliente
        LEFT JOIN servicios s ON r.id_servicio = s.id_servicio
        LEFT JOIN promociones p ON r.id_promocion = p.id_promocion
        ORDER BY r.fecha_creacion DESC
        LIMIT 5
    ");
    $stats['reservas_recientes'] = $stmt->fetchAll();

    echo json_encode(['ok' => true, 'stats' => $stats]);


/* ═══════════════════════════════════════════════════════════
   CATEGORÍAS
═══════════════════════════════════════════════════════════ */
} elseif ($action === 'get_categories') {

    $stmt = $pdo->query('SELECT id_categoria, clave, nombre, activo, orden FROM categorias ORDER BY orden');
    echo json_encode(['ok' => true, 'categories' => $stmt->fetchAll()]);


/* ═══════════════════════════════════════════════════════════
   SERVICIOS
═══════════════════════════════════════════════════════════ */
} elseif ($action === 'upload_service_image') {

    if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['ok' => false, 'message' => 'Error al subir la imagen.']);
        exit;
    }

    $file = $_FILES['imagen'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
        echo json_encode(['ok' => false, 'message' => 'Formato de imagen no válido. Use JPG, PNG o WebP.']);
        exit;
    }

    $dir = '../images/servicios/';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $filename = 'srv_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $dest = $dir . $filename;

    if (move_uploaded_file($file['tmp_name'], $dest)) {
        echo json_encode(['ok' => true, 'path' => 'images/servicios/' . $filename]);
    } else {
        echo json_encode(['ok' => false, 'message' => 'No se pudo guardar la imagen en el servidor.']);
    }


} elseif ($action === 'get_services') {

    $stmt = $pdo->query("
        SELECT s.id_servicio, s.nombre, s.descripcion, s.imagen_ruta, s.duracion_min, s.precio,
               s.activo, s.es_destacado, s.orden, s.id_categoria,
               c.nombre AS categoria_nombre, c.clave AS categoria_clave
        FROM servicios s
        JOIN categorias c ON s.id_categoria = c.id_categoria
        ORDER BY c.orden, s.orden
    ");
    echo json_encode(['ok' => true, 'services' => $stmt->fetchAll()]);


} elseif ($action === 'create_service') {

    $nombre      = trim($input['nombre']      ?? '');
    $descripcion = trim($input['descripcion'] ?? '');
    $imagen      = trim($input['imagen_ruta'] ?? '');
    $duracion    = (int) ($input['duracion_min'] ?? 60);
    $precio      = isset($input['precio']) && $input['precio'] !== '' ? (float) $input['precio'] : null;
    $categoria   = (int) ($input['id_categoria'] ?? 0);
    $destacado   = (int) ($input['es_destacado'] ?? 0);
    $orden       = (int) ($input['orden'] ?? 0);

    if (!$nombre || !$categoria) {
        echo json_encode(['ok' => false, 'message' => 'Nombre y categoría son obligatorios.']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO servicios (id_categoria, nombre, descripcion, imagen_ruta, duracion_min, precio, es_destacado, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$categoria, $nombre, $descripcion, $imagen, $duracion, $precio, $destacado, $orden]);

    echo json_encode(['ok' => true, 'message' => 'Servicio creado correctamente.', 'id' => (int) $pdo->lastInsertId()]);


} elseif ($action === 'update_service') {

    $id          = (int) ($input['id_servicio'] ?? 0);
    $nombre      = trim($input['nombre']      ?? '');
    $descripcion = trim($input['descripcion'] ?? '');
    $imagen      = trim($input['imagen_ruta'] ?? '');
    $duracion    = (int) ($input['duracion_min'] ?? 60);
    $precio      = isset($input['precio']) && $input['precio'] !== '' ? (float) $input['precio'] : null;
    $categoria   = (int) ($input['id_categoria'] ?? 0);
    $destacado   = (int) ($input['es_destacado'] ?? 0);
    $activo      = (int) ($input['activo'] ?? 1);
    $orden       = (int) ($input['orden'] ?? 0);

    if (!$id || !$nombre || !$categoria) {
        echo json_encode(['ok' => false, 'message' => 'ID, nombre y categoría son obligatorios.']);
        exit;
    }

    $stmt = $pdo->prepare(
        'UPDATE servicios SET id_categoria = ?, nombre = ?, descripcion = ?, imagen_ruta = ?, duracion_min = ?,
         precio = ?, es_destacado = ?, activo = ?, orden = ? WHERE id_servicio = ?'
    );
    $stmt->execute([$categoria, $nombre, $descripcion, $imagen, $duracion, $precio, $destacado, $activo, $orden, $id]);

    echo json_encode(['ok' => true, 'message' => 'Servicio actualizado correctamente.']);


} elseif ($action === 'delete_service') {

    $id = (int) ($input['id_servicio'] ?? 0);
    if (!$id) {
        echo json_encode(['ok' => false, 'message' => 'ID de servicio requerido.']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM servicios WHERE id_servicio = ?');
    $stmt->execute([$id]);
    echo json_encode(['ok' => true, 'message' => 'Servicio eliminado permanentemente.']);


} elseif ($action === 'toggle_service') {

    $id     = (int) ($input['id_servicio'] ?? 0);
    $activo = (int) ($input['activo'] ?? 0);
    if (!$id) {
        echo json_encode(['ok' => false, 'message' => 'ID de servicio requerido.']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE servicios SET activo = ? WHERE id_servicio = ?');
    $stmt->execute([$activo, $id]);
    echo json_encode(['ok' => true, 'message' => $activo ? 'Servicio activado.' : 'Servicio desactivado.']);


/* ═══════════════════════════════════════════════════════════
   PROMOCIONES
═══════════════════════════════════════════════════════════ */
} elseif ($action === 'get_promotions') {

    $stmt = $pdo->query("
        SELECT id_promocion, nombre, descripcion, etiqueta_badge,
               precio_original, precio_oferta, porcentaje_dto,
               activo, fecha_inicio, fecha_fin, orden
        FROM promociones
        ORDER BY orden
    ");
    echo json_encode(['ok' => true, 'promotions' => $stmt->fetchAll()]);


} elseif ($action === 'create_promotion') {

    $nombre      = trim($input['nombre']        ?? '');
    $descripcion = trim($input['descripcion']   ?? '');
    $badge       = trim($input['etiqueta_badge'] ?? '');
    $pOriginal   = isset($input['precio_original']) && $input['precio_original'] !== '' ? (float) $input['precio_original'] : null;
    $pOferta     = isset($input['precio_oferta']) && $input['precio_oferta'] !== '' ? (float) $input['precio_oferta'] : null;
    $pctDto      = isset($input['porcentaje_dto']) && $input['porcentaje_dto'] !== '' ? (int) $input['porcentaje_dto'] : null;
    $orden       = (int) ($input['orden'] ?? 0);

    if (!$nombre) {
        echo json_encode(['ok' => false, 'message' => 'El nombre es obligatorio.']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO promociones (nombre, descripcion, etiqueta_badge, precio_original, precio_oferta, porcentaje_dto, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$nombre, $descripcion, $badge, $pOriginal, $pOferta, $pctDto, $orden]);

    echo json_encode(['ok' => true, 'message' => 'Promoción creada correctamente.', 'id' => (int) $pdo->lastInsertId()]);


} elseif ($action === 'update_promotion') {

    $id          = (int) ($input['id_promocion'] ?? 0);
    $nombre      = trim($input['nombre']        ?? '');
    $descripcion = trim($input['descripcion']   ?? '');
    $badge       = trim($input['etiqueta_badge'] ?? '');
    $pOriginal   = isset($input['precio_original']) && $input['precio_original'] !== '' ? (float) $input['precio_original'] : null;
    $pOferta     = isset($input['precio_oferta']) && $input['precio_oferta'] !== '' ? (float) $input['precio_oferta'] : null;
    $pctDto      = isset($input['porcentaje_dto']) && $input['porcentaje_dto'] !== '' ? (int) $input['porcentaje_dto'] : null;
    $activo      = (int) ($input['activo'] ?? 1);
    $orden       = (int) ($input['orden'] ?? 0);

    if (!$id || !$nombre) {
        echo json_encode(['ok' => false, 'message' => 'ID y nombre son obligatorios.']);
        exit;
    }

    $stmt = $pdo->prepare(
        'UPDATE promociones SET nombre = ?, descripcion = ?, etiqueta_badge = ?,
         precio_original = ?, precio_oferta = ?, porcentaje_dto = ?, activo = ?, orden = ?
         WHERE id_promocion = ?'
    );
    $stmt->execute([$nombre, $descripcion, $badge, $pOriginal, $pOferta, $pctDto, $activo, $orden, $id]);

    echo json_encode(['ok' => true, 'message' => 'Promoción actualizada correctamente.']);


} elseif ($action === 'delete_promotion') {

    $id = (int) ($input['id_promocion'] ?? 0);
    if (!$id) {
        echo json_encode(['ok' => false, 'message' => 'ID de promoción requerido.']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE promociones SET activo = 0 WHERE id_promocion = ?');
    $stmt->execute([$id]);
    echo json_encode(['ok' => true, 'message' => 'Promoción desactivada.']);


/* ═══════════════════════════════════════════════════════════
   RESERVAS
═══════════════════════════════════════════════════════════ */
} elseif ($action === 'get_reservations') {

    $filtro_estado = trim($input['estado'] ?? ($_GET['estado'] ?? ''));

    $sql = "
        SELECT r.id_reserva, r.fecha_cita, r.estado, r.notas_reserva,
               r.precio_cobrado, r.descuento_aplicado, r.fecha_creacion,
               h.hora_inicio, h.franja,
               cl.nombre_completo AS cliente, cl.telefono AS tel_cliente, cl.correo AS email_cliente,
               COALESCE(s.nombre, '') AS servicio,
               COALESCE(p.nombre, '') AS promocion
        FROM reservas r
        JOIN clientes cl ON r.id_cliente = cl.id_cliente
        JOIN horarios_disponibles h ON r.id_horario = h.id_horario
        LEFT JOIN servicios s ON r.id_servicio = s.id_servicio
        LEFT JOIN promociones p ON r.id_promocion = p.id_promocion
    ";

    $params = [];
    if ($filtro_estado) {
        $sql .= " WHERE r.estado = ?";
        $params[] = $filtro_estado;
    }
    $sql .= " ORDER BY r.fecha_cita DESC, h.hora_inicio";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['ok' => true, 'reservations' => $stmt->fetchAll()]);


} elseif ($action === 'update_reservation_status') {

    $id     = (int) ($input['id_reserva'] ?? 0);
    $estado = trim($input['estado'] ?? '');
    $valid  = ['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'];

    if (!$id || !in_array($estado, $valid)) {
        echo json_encode(['ok' => false, 'message' => 'ID y estado válido son requeridos.']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE reservas SET estado = ? WHERE id_reserva = ?');
    $stmt->execute([$estado, $id]);
    echo json_encode(['ok' => true, 'message' => 'Estado actualizado a "' . $estado . '".']);


/* ═══════════════════════════════════════════════════════════
   ACCIÓN NO RECONOCIDA
═══════════════════════════════════════════════════════════ */
} else {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Acción no válida: ' . $action]);
}

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
