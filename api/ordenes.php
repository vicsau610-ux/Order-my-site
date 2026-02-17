<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'config.php';

// GET - Obtener órdenes de un usuario
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : 1;
    
    $sql = "SELECT o.*, 
            COUNT(oi.id) as cantidad_items,
            GROUP_CONCAT(p.nombre SEPARATOR ', ') as productos
            FROM ordenes o
            LEFT JOIN orden_items oi ON o.id = oi.id_orden
            LEFT JOIN productos p ON oi.id_producto = p.id
            WHERE o.id_usuario = $id_usuario
            GROUP BY o.id
            ORDER BY o.fecha_orden DESC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        sendJSON(['error' => 'Error en la consulta: ' . $conn->error], 500);
    }
    
    $ordenes = [];
    while ($row = $result->fetch_assoc()) {
        $row['numero_orden'] = 'ORD-' . str_pad($row['id'], 3, '0', STR_PAD_LEFT);
        $ordenes[] = $row;
    }
    
    sendJSON($ordenes);
}

// POST - Crear nueva orden
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id_usuario = isset($data['id_usuario']) ? intval($data['id_usuario']) : 1;
    $items = $data['items'];
    $subtotal = 0;
    
    // Calcular subtotal
    foreach ($items as $item) {
        $subtotal += $item['price'] * $item['quantity'];
    }
    
    $impuesto = $subtotal * 0.10;
    $total = $subtotal + $impuesto;
    
    // Generar número de orden
    $numero_orden = 'ORD-' . date('YmdHis');
    
    // Insertar orden
    $sql = "INSERT INTO ordenes (id_usuario, numero_orden, subtotal, impuesto, total, estado)
            VALUES ($id_usuario, '$numero_orden', $subtotal, $impuesto, $total, 'pendiente')";
    
    if ($conn->query($sql) === TRUE) {
        $id_orden = $conn->insert_id;
        
        // Insertar items de la orden
        foreach ($items as $item) {
            $id_producto = intval($item['id']);
            $cantidad = intval($item['quantity']);
            $precio = floatval($item['price']);
            $subtotal_item = $precio * $cantidad;
            
            $sql_item = "INSERT INTO orden_items (id_orden, id_producto, cantidad, precio_unitario, subtotal)
                        VALUES ($id_orden, $id_producto, $cantidad, $precio, $subtotal_item)";
            $conn->query($sql_item);
        }
        
        sendJSON(['id' => $id_orden, 'numero_orden' => $numero_orden, 'total' => $total, 'mensaje' => 'Orden creada'], 201);
    } else {
        sendJSON(['error' => 'Error al crear orden: ' . $conn->error], 500);
    }
}

$conn->close();
?>
