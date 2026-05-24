<?php
session_start();
require_once '../config/db.php';

// Cabeceras siempre primero
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Leer el body JSON
$rawInput = file_get_contents('php://input');
$input    = json_decode($rawInput, true);

if (!$input || !isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Acción no especificada.']);
    exit;
}

// Conectar a la BD (si falla, getDB() ya responde con JSON y hace exit)
$pdo    = getDB();
$action = $input['action'];

/* ──────────────────────────────────────────────────
   REGISTRO
────────────────────────────────────────────────── */
if ($action === 'register') {
    $name     = trim($input['name']     ?? '');
    $email    = strtolower(trim($input['email']    ?? ''));
    $phone    = trim($input['phone']    ?? '');
    $password = $input['password']      ?? '';

    // Validación básica
    if (!$name || !$email || !$phone || !$password) {
        echo json_encode(['ok' => false, 'message' => 'Todos los campos son obligatorios.']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['ok' => false, 'message' => 'El correo no tiene un formato válido.']);
        exit;
    }
    if (strlen($password) < 8) {
        echo json_encode(['ok' => false, 'message' => 'La contraseña debe tener al menos 8 caracteres.']);
        exit;
    }

    // Comprobar si el correo ya existe
    $stmt = $pdo->prepare('SELECT id_cliente FROM clientes WHERE correo = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['ok' => false, 'message' => 'Este correo ya está registrado.']);
        exit;
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO clientes (nombre_completo, correo, telefono, password) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$name, $email, $phone, $hashed]);
        $userId = (int) $pdo->lastInsertId();

        $_SESSION['user_id']   = $userId;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_phone'] = $phone;

        echo json_encode([
            'ok'      => true,
            'message' => '¡Cuenta creada con éxito!',
            'user'    => ['id' => $userId, 'name' => $name]
        ]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Error al crear la cuenta: ' . $e->getMessage()]);
    }

/* ──────────────────────────────────────────────────
   LOGIN
────────────────────────────────────────────────── */
} elseif ($action === 'login') {
    $email    = strtolower(trim($input['email']    ?? ''));
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        echo json_encode(['ok' => false, 'message' => 'Correo y contraseña son obligatorios.']);
        exit;
    }

    $stmt = $pdo->prepare(
        'SELECT id_cliente, nombre_completo, correo, telefono, password, es_admin FROM clientes WHERE correo = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Usuario no existe o la contraseña no coincide
    if (!$user || !$user['password'] || !password_verify($password, $user['password'])) {
        echo json_encode(['ok' => false, 'message' => 'Correo o contraseña incorrectos.']);
        exit;
    }

    // Iniciar sesión PHP
    session_regenerate_id(true);   // Previene session fixation
    $_SESSION['user_id']    = (int) $user['id_cliente'];
    $_SESSION['user_name']  = $user['nombre_completo'];
    $_SESSION['user_email'] = $user['correo'];
    $_SESSION['user_phone'] = $user['telefono'];
    $_SESSION['is_admin']   = (bool) ($user['es_admin'] ?? 0);

    echo json_encode([
        'ok'      => true,
        'message' => '¡Inicio de sesión exitoso!',
        'user'    => [
            'id'       => (int) $user['id_cliente'],
            'name'     => $user['nombre_completo'],
            'is_admin' => (bool) ($user['es_admin'] ?? 0)
        ]
    ]);

/* ──────────────────────────────────────────────────
   ACCIÓN NO RECONOCIDA
────────────────────────────────────────────────── */
} else {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Acción no válida.']);
}
