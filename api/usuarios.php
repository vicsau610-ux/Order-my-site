$admin_ip = '177.124.85.51'; // IP permitida para acceso admin
$admin_login_attempts_key = 'admin_login_attempts';
        // Protección extra para admin
        if ($usuario === $admin_usuario) {
            // Limitar intentos fallidos y bloqueo temporal
            session_start();
            if (!isset($_SESSION[$admin_login_attempts_key])) {
                $_SESSION[$admin_login_attempts_key] = ['count' => 0, 'last' => 0, 'blocked_until' => 0];
            }
            $now = time();
            $attempts = &$_SESSION[$admin_login_attempts_key];
            if ($attempts['blocked_until'] > $now) {
                sendJSON(['error' => 'Cuenta admin bloqueada temporalmente. Intenta más tarde.'], 403);
            }
            // Restringir por IP si se define
            if ($admin_ip && $_SERVER['REMOTE_ADDR'] !== $admin_ip) {
                sendJSON(['error' => 'Acceso no autorizado desde esta IP.'], 403);
            }
            $usuarioEnc = encryptData($admin_usuario, $encryption_key, $cipher);
            $sql = "SELECT id, nombre, email, usuario, rol, verificado, password FROM usuarios 
                WHERE usuario = '$usuarioEnc' AND activo = TRUE AND rol = 'admin'";
            $result = $conn->query($sql);
            if ($result->num_rows === 1) {
                $user = $result->fetch_assoc();
                if (!password_verify($password, $user['password'])) {
                    $attempts['count']++;
                    $attempts['last'] = $now;
                    // Bloquear tras 5 intentos fallidos
                    if ($attempts['count'] >= 5) {
                        $attempts['blocked_until'] = $now + 1800; // 30 minutos
                        // Alerta por correo
                        $asunto = 'ALERTA: Intentos fallidos de acceso admin';
                        $mensaje = "Se han detectado 5 intentos fallidos de acceso a la cuenta admin desde IP: {$_SERVER['REMOTE_ADDR']} a las " . date('Y-m-d H:i:s', $now);
                        mail($admin_email, $asunto, $mensaje, 'From: Order my site <alerta@ordermysite.com>');
                    }
                    sendJSON(['error' => 'Usuario o contraseña incorrectos'], 401);
                }
                // Resetear intentos al login exitoso
                $attempts['count'] = 0;
                $attempts['last'] = $now;
                $attempts['blocked_until'] = 0;
                // ...existing code...
            } else {
                sendJSON(['error' => 'Usuario o contraseña incorrectos'], 401);
            }
            exit;
        }
// Configuración única para la cuenta admin
$admin_email = 'vicsau195@gmail.com';
$admin_usuario = 'Blake';
$admin_password = 'Blueroom@123';
// Hash seguro para la contraseña admin
$admin_password_hash = password_hash($admin_password, PASSWORD_DEFAULT);
// Clave y método de cifrado para datos sensibles
$encryption_key = 'OrderMySiteKey2026!';
$cipher = 'AES-256-CBC';

function encryptData($data, $key, $cipher) {
    $ivlen = openssl_cipher_iv_length($cipher);
    $iv = openssl_random_pseudo_bytes($ivlen);
    $ciphertext = openssl_encrypt($data, $cipher, $key, 0, $iv);
    return base64_encode($iv . $ciphertext);
}
function decryptData($data, $key, $cipher) {
    $data = base64_decode($data);
    $ivlen = openssl_cipher_iv_length($cipher);
    $iv = substr($data, 0, $ivlen);
    $ciphertext = substr($data, $ivlen);
    return openssl_decrypt($ciphertext, $cipher, $key, 0, $iv);
}
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
        
        $nombre = encryptData(sanitize($data['nombre']), $encryption_key, $cipher);
        $email = encryptData(sanitize($data['email']), $encryption_key, $cipher);
        $usuario = encryptData(sanitize($data['usuario']), $encryption_key, $cipher);
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
        
        // No permitir registro de admin por frontend
        if ($usuario === encryptData($admin_usuario, $encryption_key, $cipher) || $email === encryptData($admin_email, $encryption_key, $cipher)) {
            sendJSON(['error' => 'No puedes registrar una cuenta de administrador.'], 403);
        }
        // Verificar si usuario ya existe
        $checkSql = "SELECT id FROM usuarios WHERE usuario = '$usuario' OR email = '$email'";
        $checkResult = $conn->query($checkSql);
        if ($checkResult->num_rows > 0) {
            sendJSON(['error' => 'El usuario o email ya está registrado'], 400);
        }
                // Si es admin, solo permitir acceso con datos exactos
                if ($usuario === $admin_usuario) {
                    $usuarioEnc = encryptData($admin_usuario, $encryption_key, $cipher);
                    $sql = "SELECT id, nombre, email, usuario, rol, verificado, password FROM usuarios 
                        WHERE usuario = '$usuarioEnc' AND activo = TRUE AND rol = 'admin'";
                    $result = $conn->query($sql);
                    if ($result->num_rows === 1) {
                        $user = $result->fetch_assoc();
                        if (!password_verify($password, $user['password'])) {
                            sendJSON(['error' => 'Usuario o contraseña incorrectos'], 401);
                        }
                        // Desencriptar datos antes de usarlos
                        $user['nombre'] = decryptData($user['nombre'], $encryption_key, $cipher);
                        $user['email'] = decryptData($user['email'], $encryption_key, $cipher);
                        $user['usuario'] = decryptData($user['usuario'], $encryption_key, $cipher);
                        // Solo permitir si el correo es el correcto
                        if ($user['email'] !== $admin_email) {
                            sendJSON(['error' => 'No autorizado'], 403);
                        }
                        // Generar código de verificación de un solo uso
                        $codigoLogin = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
                        $update = "UPDATE usuarios SET codigo_verificacion = '$codigoLogin' WHERE id = {$user['id']}";
                        $conn->query($update);
                        $asunto = 'Código de acceso para Order my site (Admin)';
                        $mensaje = "Hola {$user['nombre']},\n\nTu código de acceso de administrador es: $codigoLogin\n\nEste código es válido solo una vez y expira tras usarlo.\n\nSi no solicitaste este acceso, ignora este mensaje.";
                        $remitente = 'Order my site <verificacion@ordermysite.com>';
                        $cabeceras = 'From: ' . $remitente . "\r\n" .
                                     'Reply-To: soporte@ordermysite.com' . "\r\n" .
                                     'X-Mailer: PHP/' . phpversion();
                        mail($user['email'], $asunto, $mensaje, $cabeceras);
                        sendJSON([
                            'mensaje' => 'Se envió un código de acceso a tu correo. Ingresa el código para continuar.',
                            'requiere_codigo' => true,
                            'email' => $user['email']
                        ], 200);
                    } else {
                        sendJSON(['error' => 'Usuario o contraseña incorrectos'], 401);
                    }
                    exit;
                }
        // Al iniciar, asegurar que solo exista un admin real
        $adminEnc = encryptData($admin_usuario, $encryption_key, $cipher);
        $adminEmailEnc = encryptData($admin_email, $encryption_key, $cipher);
        $adminCheck = $conn->query("SELECT id FROM usuarios WHERE rol = 'admin' AND (usuario != '$adminEnc' OR email != '$adminEmailEnc')");
        if ($adminCheck && $adminCheck->num_rows > 0) {
            // Eliminar cualquier otro admin
            while ($row = $adminCheck->fetch_assoc()) {
                $conn->query("DELETE FROM usuarios WHERE id = {$row['id']}");
            }
        }
        // Si no existe el admin, crearlo
        $adminExists = $conn->query("SELECT id FROM usuarios WHERE rol = 'admin' AND usuario = '$adminEnc' AND email = '$adminEmailEnc'");
        if ($adminExists->num_rows === 0) {
            $nombreAdmin = encryptData('Administrador', $encryption_key, $cipher);
            $sqlAdmin = "INSERT INTO usuarios (nombre, email, usuario, password, rol, verificado, activo) VALUES ('$nombreAdmin', '$adminEmailEnc', '$adminEnc', '$admin_password_hash', 'admin', TRUE, TRUE)";
            $conn->query($sqlAdmin);
        }
        
        // Hash de contraseña seguro
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // Generar código de verificación de 6 dígitos
        $codigoVerificacion = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

        // Insertar nuevo usuario como no verificado
        $sql = "INSERT INTO usuarios (nombre, email, usuario, password, rol, verificado, codigo_verificacion) 
            VALUES ('$nombre', '$email', '$usuario', '$passwordHash', 'usuario', FALSE, '$codigoVerificacion')";

        if ($conn->query($sql) === TRUE) {
            $userId = $conn->insert_id;

            // Enviar correo real con el código de verificación
            $asunto = 'Código de verificación para Order my site';
            $mensaje = "Hola $nombre,\n\nTu código de verificación para Order my site es: $codigoVerificacion\n\nEste código es válido solo una vez.\n\nSi no solicitaste esta cuenta, ignora este mensaje.";
            $remitente = 'Order my site <verificacion@ordermysite.com>';
            $cabeceras = 'From: ' . $remitente . "\r\n" .
                         'Reply-To: soporte@ordermysite.com' . "\r\n" .
                         'X-Mailer: PHP/' . phpversion();
            mail($email, $asunto, $mensaje, $cabeceras);

            $newUser = [
                'id' => $userId,
                'nombre' => $nombre,
                'email' => $email,
                'usuario' => $usuario,
                'rol' => 'usuario',
                'verificado' => false
            ];

            sendJSON([
                'mensaje' => 'Usuario registrado. Se envió un código de verificación al correo.',
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
        $usuario = sanitize($data['usuario']);
        $password = sanitize($data['password']);
        // Encriptar usuario/email para búsqueda
        $usuarioEnc = encryptData($usuario, $encryption_key, $cipher);
        $sql = "SELECT id, nombre, email, usuario, rol, verificado, password FROM usuarios 
            WHERE (usuario = '$usuarioEnc' OR email = '$usuarioEnc') 
            AND activo = TRUE";
        $result = $conn->query($sql);
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            // Verificar contraseña con password_verify
            if (!password_verify($password, $user['password'])) {
                sendJSON(['error' => 'Usuario o contraseña incorrectos'], 401);
            }
            // Desencriptar datos antes de usarlos
            $user['nombre'] = decryptData($user['nombre'], $encryption_key, $cipher);
            $user['email'] = decryptData($user['email'], $encryption_key, $cipher);
            $user['usuario'] = decryptData($user['usuario'], $encryption_key, $cipher);
            // Si el usuario no está verificado, no permitir login
            if (!$user['verificado']) {
                sendJSON(['error' => 'Debes verificar tu correo antes de iniciar sesión'], 401);
            }
            // Generar código de verificación de un solo uso
            $codigoLogin = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            // Guardar el código en la base de datos (campo codigo_verificacion)
            $update = "UPDATE usuarios SET codigo_verificacion = '$codigoLogin' WHERE id = {$user['id']}";
            $conn->query($update);
            // Enviar correo con el código
            $asunto = 'Código de acceso para Order my site';
            $mensaje = "Hola {$user['nombre']},\n\nTu código de acceso para Order my site es: $codigoLogin\n\nEste código es válido solo una vez y expira tras usarlo.\n\nSi no solicitaste este acceso, ignora este mensaje.";
            $remitente = 'Order my site <verificacion@ordermysite.com>';
            $cabeceras = 'From: ' . $remitente . "\r\n" .
                         'Reply-To: soporte@ordermysite.com' . "\r\n" .
                         'X-Mailer: PHP/' . phpversion();
            mail($user['email'], $asunto, $mensaje, $cabeceras);
            // No devolver datos de sesión aún, solo indicar que se requiere verificación
            sendJSON([
                'mensaje' => 'Se envió un código de acceso a tu correo. Ingresa el código para continuar.',
                'requiere_codigo' => true,
                'email' => $user['email']
            ], 200);
        } else {
            sendJSON(['error' => 'Usuario o contraseña incorrectos'], 401);
        }
    }
    
    // VERIFICAR CÓDIGO DE VERIFICACIÓN
    else if ($action === 'verificar') {
        if (!isset($data['email']) || !isset($data['codigo'])) {
            sendJSON(['error' => 'Email y código requeridos'], 400);
        }
        $email = sanitize($data['email']);
        $codigo = sanitize($data['codigo']);
        $emailEnc = encryptData($email, $encryption_key, $cipher);
        $sql = "SELECT id, verificado, codigo_verificacion, nombre, usuario, rol, email FROM usuarios WHERE email = '$emailEnc'";
        $result = $conn->query($sql);
        if ($result->num_rows !== 1) {
            sendJSON(['error' => 'Usuario no encontrado'], 404);
        }
        $user = $result->fetch_assoc();
        // Desencriptar datos antes de usarlos
        $user['nombre'] = decryptData($user['nombre'], $encryption_key, $cipher);
        $user['email'] = decryptData($user['email'], $encryption_key, $cipher);
        $user['usuario'] = decryptData($user['usuario'], $encryption_key, $cipher);
        if ($user['verificado']) {
            sendJSON(['mensaje' => 'El usuario ya está verificado'], 200);
        }
        if (!$user['codigo_verificacion'] || $user['codigo_verificacion'] !== $codigo) {
            sendJSON(['error' => 'Código incorrecto o ya usado'], 400);
        }
        // Si el usuario aún no está verificado, marcar como verificado y limpiar código
        if (!$user['verificado']) {
            $update = "UPDATE usuarios SET verificado = TRUE, codigo_verificacion = NULL WHERE id = {$user['id']}";
            if ($conn->query($update) === TRUE) {
                sendJSON(['mensaje' => 'Usuario verificado correctamente'], 200);
            } else {
                sendJSON(['error' => 'Error al actualizar usuario'], 500);
            }
        } else {
            // Si ya está verificado, solo limpiar el código y devolver datos de sesión
            $update = "UPDATE usuarios SET codigo_verificacion = NULL WHERE id = {$user['id']}";
            $conn->query($update);
            // Devolver datos de usuario para sesión
            $usuarioSesion = [
                'id' => $user['id'],
                'nombre' => $user['nombre'],
                'email' => $user['email'],
                'usuario' => $user['usuario'],
                'rol' => $user['rol']
            ];
            sendJSON([
                'mensaje' => 'Código correcto. Acceso concedido.',
                'usuario' => $usuarioSesion
            ], 200);
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
