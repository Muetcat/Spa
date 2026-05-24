<?php
// api/get_paypal_config.php
require_once '../config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Solo usuarios logueados pueden obtener esta información, por seguridad
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'No autorizado. Inicia sesión.']);
    exit;
}

echo json_encode([
    'ok' => true,
    'paypal_client_id' => defined('PAYPAL_CLIENT_ID') ? PAYPAL_CLIENT_ID : 'test',
    'paypal_currency'  => defined('PAYPAL_CURRENCY') ? PAYPAL_CURRENCY : 'USD'
]);
