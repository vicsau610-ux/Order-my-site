<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'config.php';

// POST - Guardar mensaje
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id_usuario = isset($data['id_usuario']) ? intval($data['id_usuario']) : 1;
    $id_orden = isset($data['id_orden']) ? intval($data['id_orden']) : NULL;
    $tipo = sanitize($data['tipo']); // 'usuario' o 'vendedor'
    $contenido = sanitize($data['contenido']);
    
    $sql = "INSERT INTO mensajes (id_usuario, id_orden, tipo, contenido)
            VALUES ($id_usuario, " . ($id_orden ? $id_orden : 'NULL') . ", '$tipo', '$contenido')";
    
    if ($conn->query($sql) === TRUE) {
        sendJSON(['id' => $conn->insert_id, 'mensaje' => 'Mensaje guardado'], 201);
    } else {
        sendJSON(['error' => 'Error al guardar mensaje: ' . $conn->error], 500);
    }
}

// GET - Obtener mensajes
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : 1;
    $id_orden = isset($_GET['id_orden']) ? intval($_GET['id_orden']) : NULL;
    
    $where = "id_usuario = $id_usuario";
    if ($id_orden) {
        $where .= " AND (id_orden = $id_orden OR id_orden IS NULL)";
    }
    
    $sql = "SELECT * FROM mensajes WHERE $where ORDER BY fecha_mensaje ASC";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendJSON(['error' => 'Error en la consulta: ' . $conn->error], 500);
    }
    
    $mensajes = [];
    while ($row = $result->fetch_assoc()) {
        $mensajes[] = $row;
    }
    
    sendJSON($mensajes);
}

$conn->close();
?>
