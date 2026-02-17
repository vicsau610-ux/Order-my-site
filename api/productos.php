<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'config.php';

// GET - Obtener todos los productos
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM productos WHERE disponible = TRUE ORDER BY id";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendJSON(['error' => 'Error en la consulta: ' . $conn->error], 500);
    }
    
    $productos = [];
    while ($row = $result->fetch_assoc()) {
        $productos[] = $row;
    }
    
    sendJSON($productos);
}

// POST - Agregar nuevo producto (para administración)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $nombre = sanitize($data['nombre']);
    $descripcion = sanitize($data['descripcion']);
    $precio = floatval($data['precio']);
    $emoji = sanitize($data['emoji']);
    
    $sql = "INSERT INTO productos (nombre, descripcion, precio, emoji) 
            VALUES ('$nombre', '$descripcion', $precio, '$emoji')";
    
    if ($conn->query($sql) === TRUE) {
        sendJSON(['id' => $conn->insert_id, 'mensaje' => 'Producto creado'], 201);
    } else {
        sendJSON(['error' => 'Error al crear producto: ' . $conn->error], 500);
    }
}

$conn->close();
?>
