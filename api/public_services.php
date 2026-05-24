<?php
// api/public_services.php
require_once '../config/db.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

try {
    $pdo = getDB();
    $category_key = $_GET['category'] ?? '';

    if ($category_key) {
        $stmt = $pdo->prepare("
            SELECT s.id_servicio, s.nombre, s.descripcion, s.imagen_ruta, s.duracion_min, s.precio
            FROM servicios s
            JOIN categorias c ON s.id_categoria = c.id_categoria
            WHERE c.clave = ? AND s.activo = 1
            ORDER BY s.orden, s.id_servicio
        ");
        $stmt->execute([$category_key]);
    } else {
        $stmt = $pdo->query("
            SELECT s.id_servicio, s.nombre, s.descripcion, s.imagen_ruta, s.duracion_min, s.precio, c.clave AS categoria_clave
            FROM servicios s
            JOIN categorias c ON s.id_categoria = c.id_categoria
            WHERE s.activo = 1
            ORDER BY c.orden, s.orden
        ");
    }

    $services = $stmt->fetchAll();
    echo json_encode(['ok' => true, 'services' => $services]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Error en el servidor.']);
}
