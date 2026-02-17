<?php
// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'webcraft');

// Crear conexión
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(['error' => 'Error en la conexión: ' . $conn->connect_error]));
}

// Configurar charset
$conn->set_charset("utf8mb4");

// Funciones auxiliares
function sendJSON($data, $statusCode = 200) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function sanitize($data) {
    global $conn;
    return $conn->real_escape_string($data);
}
?>
