<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'config.php';

// POST - Crear pedido personalizado
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $nombre = sanitize($data['nombre']);
    $email = sanitize($data['email']);
    $telefono = isset($data['telefono']) ? sanitize($data['telefono']) : '';
    $tipo = sanitize($data['tipo']);
    $descripcion = sanitize($data['descripcion']);
    $presupuesto = isset($data['presupuesto']) ? floatval($data['presupuesto']) : NULL;
    $fecha_entrega = isset($data['fecha_entrega']) ? sanitize($data['fecha_entrega']) : NULL;
    
    $sql = "INSERT INTO pedidos_personalizados 
            (nombre_contacto, email_contacto, telefono, tipo_producto, descripcion, presupuesto, fecha_entrega_deseada)
            VALUES ('$nombre', '$email', '$telefono', '$tipo', '$descripcion', $presupuesto, '$fecha_entrega')";
    
    if ($conn->query($sql) === TRUE) {
        $id = $conn->insert_id;
        sendJSON(['id' => $id, 'mensaje' => 'Pedido personalizado creado correctamente'], 201);
    } else {
        sendJSON(['error' => 'Error al crear pedido: ' . $conn->error], 500);
    }
}

// GET - Obtener pedidos personalizados
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM pedidos_personalizados ORDER BY fecha_solicitud DESC";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendJSON(['error' => 'Error en la consulta: ' . $conn->error], 500);
    }
    
    $pedidos = [];
    while ($row = $result->fetch_assoc()) {
        $pedidos[] = $row;
    }
    
    sendJSON($pedidos);
}

$conn->close();
?>
