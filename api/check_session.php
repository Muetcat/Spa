<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

if (isset($_SESSION['user_id'])) {
    /* Consultar si es admin desde la BD (o usar la sesión si ya está guardado) */
    $is_admin = false;
    if (isset($_SESSION['is_admin'])) {
        $is_admin = (bool) $_SESSION['is_admin'];
    } else {
        try {
            $pdo = getDB();
            $stmt = $pdo->prepare('SELECT es_admin FROM clientes WHERE id_cliente = ? LIMIT 1');
            $stmt->execute([$_SESSION['user_id']]);
            $row = $stmt->fetch();
            if ($row) {
                $is_admin = (bool) $row['es_admin'];
                $_SESSION['is_admin'] = $is_admin;
            }
        } catch (Exception $e) { /* silently ignore */ }
    }

    echo json_encode([
        'logged_in' => true,
        'user'      => [
            'id'       => $_SESSION['user_id'],
            'name'     => $_SESSION['user_name'],
            'email'    => $_SESSION['user_email'] ?? '',
            'phone'    => $_SESSION['user_phone'] ?? '',
            'is_admin' => $is_admin
        ]
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}
