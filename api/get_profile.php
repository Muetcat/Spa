<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'No autorizado. Inicia sesión.']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];
$pdo = getDB();

try {
    // Obtener información del cliente
    $stmt = $pdo->prepare('SELECT id_cliente, nombre_completo, correo, telefono FROM clientes WHERE id_cliente = ? LIMIT 1');
    $stmt->execute([$user_id]);
    $cliente = $stmt->fetch();

    if (!$cliente) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'Cliente no encontrado.']);
        exit;
    }

    // Obtener reservas del cliente
    $stmt_res = $pdo->prepare('
        SELECT 
            r.id_reserva, 
            r.fecha_cita, 
            h.hora_inicio,
            s.nombre AS servicio_nombre,
            p.nombre AS promo_nombre
        FROM reservas r
        LEFT JOIN horarios_disponibles h ON r.id_horario = h.id_horario
        LEFT JOIN servicios s ON r.id_servicio = s.id_servicio
        LEFT JOIN promociones p ON r.id_promocion = p.id_promocion
        WHERE r.id_cliente = ?
        ORDER BY r.fecha_cita DESC, h.hora_inicio DESC
    ');
    $stmt_res->execute([$user_id]);
    $reservas = $stmt_res->fetchAll();

    echo json_encode([
        'ok' => true,
        'cliente' => [
            'nombre'   => $cliente['nombre_completo'],
            'correo'   => $cliente['correo'],
            'telefono' => $cliente['telefono']
        ],
        'reservas' => $reservas
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error al obtener perfil: ' . $e->getMessage()]);
}
