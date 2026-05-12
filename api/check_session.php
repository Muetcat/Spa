<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'logged_in' => true,
        'user'      => [
            'id'    => $_SESSION['user_id'],
            'name'  => $_SESSION['user_name'],
            'email' => $_SESSION['user_email'] ?? ''
        ]
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}
