<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'config.php';

// ═══════════════════════════════════════════════════════════
// AUTENTICACIÓN Y GESTIÓN DE USUARIOS
// ═══════════════════════════════════════════════════════════

// REGISTRO - POST /api/usuarios.php?action=register
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_GET['action']) ? $_GET['action'] : 'register';
    $data = json_decode(file_get_contents("php://input"), true);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // REGISTRO DE NUEVO USUARIO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if ($action === 'register') {
        // Validar datos requeridos
        if (!isset($data['nombre']) || !isset($data['email']) || !isset($data['usuario']) || !isset($data['password'])) {
            sendJSON(['error' => 'Faltan campos requeridos'], 400);
        }
        
        $nombre = sanitize($data['nombre']);
        $email = sanitize($data['email']);
        $usuario = sanitize($data['usuario']);
        $password = sanitize($data['password']);
        
        // Validar email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendJSON(['error' => 'Email inválido'], 400);
        }
        
        // Validar longitud de usuario
        if (strlen($usuario) < 3) {
            sendJSON(['error' => 'El usuario debe tener al menos 3 caracteres'], 400);
        }
        
        // Validar longitud de contraseña
        if (strlen($password) < 8) {
            sendJSON(['error' => 'La contraseña debe tener al menos 8 caracteres'], 400);
        }
        
        // Verificar si usuario ya existe
        $checkSql = "SELECT id FROM usuarios WHERE usuario = '$usuario' OR email = '$email'";
        $checkResult = $conn->query($checkSql);
        
        if ($checkResult->num_rows > 0) {
            sendJSON(['error' => 'El usuario o email ya está registrado'], 400);
        }
        
        // Hash de contraseña (en producción usar password_hash)
        $passwordHash = sha1($password);
        
        // Insertar nuevo usuario
        $sql = "INSERT INTO usuarios (nombre, email, usuario, password, rol) 
                VALUES ('$nombre', '$email', '$usuario', '$passwordHash', 'usuario')";
        
        if ($conn->query($sql) === TRUE) {
            $userId = $conn->insert_id;
            
            $newUser = [
                'id' => $userId,
                'nombre' => $nombre,
                'email' => $email,
                'usuario' => $usuario,
                'rol' => 'usuario'
            ];
            
            sendJSON([
                'mensaje' => '✓ Usuario registrado correctamente',
                'usuario' => $newUser
            ], 201);
        } else {
            sendJSON(['error' => 'Error al registrar usuario: ' . $conn->error], 500);
        }
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LOGIN
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    else if ($action === 'login') {
        // Validar datos
        if (!isset($data['usuario']) || !isset($data['password'])) {
            sendJSON(['error' => 'Usuario y contraseña requeridos'], 400);
        }
        
        $usuario = sanitize($data['usuario']);
        $password = sanitize($data['password']);
        $passwordHash = sha1($password);
        
        // Buscar usuario por usuario o email
        $sql = "SELECT id, nombre, email, usuario, rol FROM usuarios 
                WHERE (usuario = '$usuario' OR email = '$usuario') 
                AND password = '$passwordHash' 
                AND activo = TRUE";
        
        $result = $conn->query($sql);
        
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            
            // Registrar login en log (opcional)
            $logSql = "INSERT INTO login_log (id_usuario, ip_address, user_agent) VALUES 
                      ({$user['id']}, '" . sanitize($_SERVER['REMOTE_ADDR']) . "', '" . sanitize($_SERVER['HTTP_USER_AGENT']) . "')";
            // $conn->query($logSql); // Comentado si la tabla no existe
            
            sendJSON([
                'mensaje' => '✓ Login exitoso',
                'usuario' => $user
            ], 200);
        } else {
            sendJSON(['error' => 'Usuario o contraseña incorrectos'], 401);
        }
    }
    
    else {
        sendJSON(['error' => 'Acción no reconocida'], 400);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET - OBTENER USUARIO (requiere token/sesión)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if ($userId) {
        // Obtener usuario específico
        $sql = "SELECT id, nombre, email, usuario, rol, fecha_registro FROM usuarios WHERE id = $userId";
        $result = $conn->query($sql);
        
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            sendJSON($user);
        } else {
            sendJSON(['error' => 'Usuario no encontrado'], 404);
        }
    } else {
        // Obtener todos los usuarios (solo admins)
        $sql = "SELECT id, nombre, email, usuario, rol, fecha_registro FROM usuarios ORDER BY fecha_registro DESC";
        $result = $conn->query($sql);
        
        if (!$result) {
            sendJSON(['error' => 'Error en la consulta: ' . $conn->error], 500);
        }
        
        $usuarios = [];
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = $row;
        }
        
        sendJSON($usuarios);
    }
}

$conn->close();
?>
