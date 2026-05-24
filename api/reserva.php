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

// Recoger campos comunes
$nombre          = trim($input['nombre']   ?? '');
$telefono        = trim($input['telefono'] ?? '');
$email           = strtolower(trim($input['email']    ?? ''));
$fecha           = trim($input['fecha']     ?? '');
$horario_inicio  = trim($input['horario']   ?? '');
$notas           = trim($input['notas']     ?? '');

// Campos de pago
$metodo_pago       = strtolower(trim($input['metodo_pago'] ?? 'local'));
$estado_pago       = strtolower(trim($input['estado_pago'] ?? 'pendiente'));
$paypal_order_id   = isset($input['paypal_order_id']) ? trim($input['paypal_order_id']) : null;
$paypal_capture_id = isset($input['paypal_capture_id']) ? trim($input['paypal_capture_id']) : null;
$monto_pagado      = floatval($input['monto_pagado'] ?? 0.00);

// Validar obligatorios comunes
if (!$nombre || !$telefono || !$email || !$fecha || !$horario_inicio) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Faltan campos obligatorios.']);
    exit;
}

/* Determinar modo: carrito (servicios[]) o manual (categoria + servicio) */
$servicios_arr = $input['servicios'] ?? null;
$is_cart_mode  = is_array($servicios_arr) && count($servicios_arr) > 0;

if (!$is_cart_mode) {
    // Modo manual: necesitamos servicio individual
    $servicio_nombre = trim($input['servicio'] ?? '');
    $categoria       = trim($input['categoria'] ?? '');
    if (!$servicio_nombre) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Debes seleccionar al menos un servicio.']);
        exit;
    }
    // Convertir a formato de array para unificar el flujo
    $servicios_arr = [
        ['nombre' => $servicio_nombre, 'categoria' => $categoria, 'qty' => 1]
    ];
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

    /* ── 2. Resolver horario ───────────────────────── */
    $hora_buscar = $horario_inicio;
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

    /* ── 3. Crear una reserva por cada servicio del carrito ── */
    $reservas_creadas = 0;

    foreach ($servicios_arr as $srv) {
        $srv_nombre   = trim($srv['nombre']    ?? '');
        $srv_categoria = trim($srv['categoria'] ?? '');
        $srv_qty      = max(1, (int) ($srv['qty'] ?? 1));

        if (!$srv_nombre) continue;

        $id_servicio  = null;
        $id_promocion = null;

        // Detectar si es promoción por la categoría
        $es_promo = (stripos($srv_categoria, 'promo') !== false)
                 || (stripos($srv_categoria, 'Pack')  !== false);

        if ($es_promo) {
            $stmt = $pdo->prepare('SELECT id_promocion FROM promociones WHERE nombre = ? LIMIT 1');
            $stmt->execute([$srv_nombre]);
            $row = $stmt->fetch();
            if ($row) {
                $id_promocion = (int) $row['id_promocion'];
            }
        }

        if (!$id_promocion) {
            // Buscar en servicios por nombre exacto
            $stmt = $pdo->prepare('SELECT id_servicio FROM servicios WHERE nombre = ? LIMIT 1');
            $stmt->execute([$srv_nombre]);
            $row = $stmt->fetch();
            if (!$row) {
                // Fallback: LIKE
                $stmt = $pdo->prepare('SELECT id_servicio FROM servicios WHERE nombre LIKE ? LIMIT 1');
                $stmt->execute(['%' . $srv_nombre . '%']);
                $row = $stmt->fetch();
            }
            if ($row) {
                $id_servicio = (int) $row['id_servicio'];
            }
        }

        if (!$id_servicio && !$id_promocion) {
            throw new Exception('El servicio "' . $srv_nombre . '" no existe en la base de datos.');
        }

        $estado_reserva = ($metodo_pago === 'paypal' && $estado_pago === 'pagado') ? 'confirmada' : 'pendiente';

        // Crear N reservas según la cantidad
        for ($q = 0; $q < $srv_qty; $q++) {
            $stmt = $pdo->prepare(
                'INSERT INTO reservas 
                    (id_cliente, id_servicio, id_promocion, id_horario, fecha_cita, notas_reserva, estado, metodo_pago, estado_pago, paypal_order_id, paypal_capture_id, monto_pagado) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $cliente_id,
                $id_servicio,
                $id_promocion,
                $id_horario,
                $fecha,
                $notas,
                $estado_reserva,
                $metodo_pago,
                $estado_pago,
                $paypal_order_id,
                $paypal_capture_id,
                $monto_pagado
            ]);
            $reservas_creadas++;
        }
    }

    if ($reservas_creadas === 0) {
        throw new Exception('No se pudo crear ninguna reserva. Verifica los servicios seleccionados.');
    }

    $pdo->commit();

    $msg = $reservas_creadas === 1
        ? '¡Reserva creada con éxito! Te contactaremos pronto.'
        : "¡$reservas_creadas reservas creadas con éxito! Te contactaremos pronto.";

    echo json_encode(['ok' => true, 'message' => $msg]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error al guardar la reserva: ' . $e->getMessage()]);
}
