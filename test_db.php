<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'config/db.php';

echo "<h1>Diagnóstico de Base de Datos</h1>";

try {
    $pdo = getDB();
    echo "<p style='color:green'>Conexión a la base de datos: <b>Exitosa</b></p>";
} catch (Exception $e) {
    echo "<p style='color:red'>Error de conexión: " . htmlspecialchars($e->getMessage()) . "</p>";
    exit;
}

// Verificar tabla clientes
try {
    $stmt = $pdo->query("DESCRIBE clientes");
    $columnas = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (in_array('password', $columnas)) {
        echo "<p style='color:green'>Columna 'password' en tabla 'clientes': <b>Existe</b></p>";
    } else {
        echo "<p style='color:red'>Columna 'password' en tabla 'clientes': <b>FALTA</b></p>";
        echo "<p>Por favor, ejecuta este comando SQL en phpMyAdmin:<br>";
        echo "<code>ALTER TABLE clientes ADD COLUMN password VARCHAR(255) DEFAULT '' AFTER correo;</code></p>";
    }
} catch (Exception $e) {
    echo "<p style='color:red'>Error al leer la tabla 'clientes': " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<h2>Prueba terminada.</h2>";
