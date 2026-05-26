<?php
// api/public_stats.php
require_once '../config/db.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

try {
    $pdo = getDB();

    // 1. Contar clientas reales (excluyendo administradores)
    $stmtClientes = $pdo->query("SELECT COUNT(*) FROM clientes WHERE es_admin = 0");
    $totalClientes = (int)$stmtClientes->fetchColumn();

    // 2. Contar tratamientos activos
    $stmtServicios = $pdo->query("SELECT COUNT(*) FROM servicios WHERE activo = 1");
    $totalServicios = (int)$stmtServicios->fetchColumn();

    echo json_encode([
        'ok' => true,
        'clientes' => $totalClientes,
        'servicios' => $totalServicios,
        'anios' => 8
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Error al obtener estadísticas de la base de datos.'
    ]);
}
