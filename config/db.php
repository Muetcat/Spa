<?php
/* ── Configuración de la base de datos ──────────────────────
   Cambia los valores según tu entorno (XAMPP, WAMP, hosting)
──────────────────────────────────────────────────────────── */
define('DB_HOST',    'localhost');
define('DB_PORT',    '3306');
define('DB_NAME',    'susyestetic');
define('DB_USER',    'root');  
define('DB_PASS',    '3008');       
define('DB_CHARSET', 'utf8mb4');

/**
 * Retorna una conexión PDO singleton.
 * Si falla, responde con JSON de error y termina la ejecución.
 */
function getDB(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
    );

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'      => false,
            'message' => 'No se pudo conectar a la base de datos. Verifica config/db.php.',
            'debug'   => $e->getMessage(),   // Quitar en producción
        ]);
        exit;
    }

    return $pdo;
}
