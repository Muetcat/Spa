<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

$rawInput = file_get_contents('php://input');
$input    = json_decode($rawInput, true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'No se recibieron datos.']);
    exit;
}

// Recoger campos
$nombre          = trim($input['nombre']   ?? '');
$telefono        = trim($input['telefono'] ?? '');
$email           = strtolower(trim($input['email']    ?? ''));
$categoria       = trim($input['categoria'] ?? '');
$servicio_nombre = trim($input['servicio']  ?? '');
$fecha           = trim($input['fecha']     ?? '');
$horario_inicio  = trim($input['horario']   ?? '');
$notas           = trim($input['notas']     ?? '');

// Validar obligatorios
if (!$nombre || !$telefono || !$email || !$servicio_nombre || !$fecha || !$horario_inicio) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Faltan campos obligatorios.']);
    exit;
}

// Validar fecha no pasada
if (strtotime($fecha) < strtotime(date('Y-m-d'))) {
    echo json_encode(['ok' => false, 'message' => 'La fecha seleccionada ya pasó.']);
    exit;
}

$pdo = getDB();

try {
    $pdo->beginTransaction();

    /* ── 1. Obtener o crear el cliente ─────────────── */
    $cliente_id = null;

    if (isset($_SESSION['user_id'])) {
        // Usuario logueado: usar su ID directamente
        $cliente_id = (int) $_SESSION['user_id'];
    } else {
        // Invitado: buscar por correo
        $stmt = $pdo->prepare('SELECT id_cliente FROM clientes WHERE correo = ? LIMIT 1');
        $stmt->execute([$email]);
        $row = $stmt->fetch();

        if ($row) {
            $cliente_id = (int) $row['id_cliente'];
        } else {
            // Crear cliente invitado (sin contraseña)
            $stmt = $pdo->prepare(
                'INSERT INTO clientes (nombre_completo, telefono, correo, password) VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$nombre, $telefono, $email, '']);
            $cliente_id = (int) $pdo->lastInsertId();
        }
    }

    /* ── 2. Resolver servicio o promoción ──────────── */
    $id_servicio  = null;
    $id_promocion = null;

    if ($categoria === 'promo') {
        // Buscar por nombre exacto en promociones
        $stmt = $pdo->prepare('SELECT id_promocion FROM promociones WHERE nombre = ? LIMIT 1');
        $stmt->execute([$servicio_nombre]);
        $row = $stmt->fetch();
        if ($row) {
            $id_promocion = (int) $row['id_promocion'];
        }
    } else {
        // Buscar por nombre en servicios (búsqueda parcial como fallback)
        $stmt = $pdo->prepare('SELECT id_servicio FROM servicios WHERE nombre = ? LIMIT 1');
        $stmt->execute([$servicio_nombre]);
        $row = $stmt->fetch();
        if (!$row) {
            // Fallback: buscar con LIKE en caso de que el nombre venga levemente diferente
            $stmt = $pdo->prepare('SELECT id_servicio FROM servicios WHERE nombre LIKE ? LIMIT 1');
            $stmt->execute(['%' . $servicio_nombre . '%']);
            $row = $stmt->fetch();
        }
        if ($row) {
            $id_servicio = (int) $row['id_servicio'];
        }
    }

    if (!$id_servicio && !$id_promocion) {
        throw new Exception('El servicio seleccionado no existe en la base de datos: "' . $servicio_nombre . '"');
    }

    /* ── 3. Resolver horario ───────────────────────── */
    // El frontend envía "09:00", "10:30", etc.
    // MySQL TIME puede ser "09:00:00" → igualamos agregando ":00"
    $hora_buscar = $horario_inicio;
    // Si ya tiene segundos (HH:MM:SS) dejarlo, si no agregar :00
    if (preg_match('/^\d{1,2}:\d{2}$/', $hora_buscar)) {
        $hora_buscar = $hora_buscar . ':00';
    }

    $stmt = $pdo->prepare('SELECT id_horario FROM horarios_disponibles WHERE hora_inicio = ? LIMIT 1');
    $stmt->execute([$hora_buscar]);
    $row = $stmt->fetch();

    if (!$row) {
        throw new Exception('El horario seleccionado no es válido: "' . $horario_inicio . '"');
    }
    $id_horario = (int) $row['id_horario'];

    /* ── 4. Insertar reserva ───────────────────────── */
    $stmt = $pdo->prepare(
        'INSERT INTO reservas 
            (id_cliente, id_servicio, id_promocion, id_horario, fecha_cita, notas_reserva) 
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $cliente_id,
        $id_servicio,     // NULL si es promo
        $id_promocion,    // NULL si es servicio
        $id_horario,
        $fecha,
        $notas
    ]);

    $pdo->commit();

    echo json_encode(['ok' => true, 'message' => '¡Reserva creada con éxito! Te contactaremos pronto.']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error al guardar la reserva: ' . $e->getMessage()]);
}
