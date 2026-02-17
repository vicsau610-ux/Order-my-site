// Sistema de Autenticación para WebCraft

// Estructura de usuario en localStorage
const USERS_KEY = 'webcraft_users';
const CURRENT_USER_KEY = 'webcraft_current_user';
const LOGIN_ATTEMPTS_KEY = 'webcraft_login_attempts';
const SECURITY_LOG_KEY = 'webcraft_security_log';
const SESSION_TIMEOUT_KEY = 'webcraft_session_timeout';
const LOGIN_LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutos
const MAX_LOGIN_ATTEMPTS = 3;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inactividad
const MAX_PASSWORD_LENGTH = 128;
const MAX_USERNAME_LENGTH = 50;

const ADMIN_USER = {
    id: 0,
    nombre: 'Administrador',
    email: 'admin@webcraft.com',
    usuario: 'Anonymous',
    password: 'Blueroom@123',
    rol: 'admin',
    fecha_creacion: new Date().toISOString(),
    twoFactorEnabled: true
};

// Inicializar base de datos de usuarios
function initUsers() {
    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    
    // 🔒 SEGURIDAD: Limpiar admin antiguo Blake si existe
    users = users.filter(u => u.usuario !== 'Blake');
    
    // 🔒 SEGURIDAD: Siempre garantizar que Anonymous (admin) esté presente
    const adminExists = users.some(u => u.usuario === 'Anonymous');
    
    if (!adminExists) {
        // Añadir al admin Anonymous si no existe
        users.unshift(ADMIN_USER);
        console.log('✓ Usuario administrador Anonymous añadido a la base de datos');
    } else {
        // Actualizar datos de Anonymous por si han cambiado
        const adminIndex = users.findIndex(u => u.usuario === 'Anonymous');
        users[adminIndex] = ADMIN_USER;
        console.log('✓ Usuario Anonymous actualizado');
    }
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    console.log('✓ Base de datos de usuarios inicializada correctamente');
}

// ═══════════════════════════════════════════════════════════
// FUNCIONES DE SEGURIDAD - MÁXIMA PROTECCIÓN
// ═══════════════════════════════════════════════════════════

// 1. HASH SIMPLE DE CONTRASEÑA (sin librería externa)
function hashPassword(password) {
    let hash = 0;
    if (password.length === 0) return hash.toString();
    for (let i = 0; i < password.length; i++) {
        let char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a entero de 32 bits
    }
    return 'hash_' + Math.abs(hash).toString(36);
}

// 2. VALIDACIÓN DE FORTALEZA DE CONTRASEÑA
function validatePasswordStrength(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        noCommonPatterns: !/(password|123456|admin|letmein|qwerty)/i.test(password)
    };
    
    const strength = Object.values(requirements).filter(Boolean).length;
    return {
        isValid: strength >= 4,
        strength: strength,
        requirements: requirements,
        message: strength < 4 ? '⚠️ Contraseña débil. Requiere: mayúsculas, minúsculas, números y caracteres especiales' : '✓ Contraseña fuerte'
    };
}

// 3. SANITIZACIÓN DE INPUTS (Prevenir XSS)
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .trim()
        .replace(/[<>\"']/g, '')
        .substring(0, MAX_USERNAME_LENGTH);
}

// 4. VALIDACIÓN DE EMAIL
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 5. SESSION TIMEOUT - Logout automático por inactividad
function resetSessionTimeout() {
    clearTimeout(window.sessionTimeoutId);
    localStorage.setItem(SESSION_TIMEOUT_KEY, Date.now().toString());
    
    window.sessionTimeoutId = setTimeout(() => {
        logSecurityEvent('Session timeout - Usuario deslogueado por inactividad');
        logout();
        alert('⏱️ Su sesión ha expirado por inactividad (30 minutos). Por favor, inicie sesión nuevamente.');
    }, SESSION_TIMEOUT);
}

// 6. MONITOREO DE INACTIVIDAD
document.addEventListener('mousemove', resetSessionTimeout);
document.addEventListener('keypress', resetSessionTimeout);
document.addEventListener('click', resetSessionTimeout);
document.addEventListener('scroll', resetSessionTimeout);

// 7. LOGGING DE EVENTOS DE SEGURIDAD
function logSecurityEvent(event, details = {}) {
    const logs = JSON.parse(localStorage.getItem(SECURITY_LOG_KEY)) || [];
    const user = getCurrentUser();
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        event: event,
        user: user ? user.usuario : 'Anónimo',
        details: details,
        ip: 'Local' // En producción sería obtenido del servidor
    };
    
    logs.push(logEntry);
    
    // Guardar solo los últimos 100 eventos
    if (logs.length > 100) {
        logs.shift();
    }
    
    localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(logs));
    console.log('🔐 Evento de seguridad:', logEntry);
}

// 8. VERIFICACIÓN DE INTEGRIDAD DE USUARIO
function verifyUserIntegrity(user) {
    if (!user || !user.usuario || !user.password || !user.rol) {
        logSecurityEvent('Intento de acceso con datos de usuario inválidos');
        return false;
    }
    return true;
}

// PROTECCIÓN CONTRA ATAQUES DE FUERZA BRUTA MEJORADA
function getDeviceFingerprint() {
    return navigator.userAgent.substring(0, 50);
}

// Cambiar entre tabs
function switchTab(tabName, event) {
    if (event) event.preventDefault();
    
    // Ocultar todos los tabs
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => content.classList.remove('active'));
    
    // Limpiar mensajes
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => msg.classList.remove('error', 'success'));
    
    // Ocultar todos los tabs de contenido
    document.getElementById('login').classList.remove('active');
    document.getElementById('registro').classList.remove('active');
    
    // Mostrar tab seleccionado si se proporcionó evento
    if (event && event.target) {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Mostrar mensaje en el formulario
function showMessage(tabName, message, isError = false) {
    const messageEl = document.getElementById(`${tabName}-message`);
    messageEl.textContent = message;
    messageEl.classList.remove('error', 'success');
    messageEl.classList.add(isError ? 'error' : 'success');
}

// Funciones para controlar intentos fallidos
function getLoginAttempts() {
    const data = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!data) return { attempts: 0, timestamp: null };
    
    const parsed = JSON.parse(data);
    const now = Date.now();
    
    // Si han pasado más de 5 minutos, resetear intentos
    if (now - parsed.timestamp > LOGIN_LOCKOUT_TIME) {
        localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
        return { attempts: 0, timestamp: null };
    }
    
    return parsed;
}

function recordFailedAttempt() {
    const attempts = (getLoginAttempts().attempts || 0) + 1;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({
        attempts: attempts,
        timestamp: Date.now()
    }));
    return attempts;
}

function isLoginBlocked() {
    const data = getLoginAttempts();
    return data.attempts >= MAX_LOGIN_ATTEMPTS;
}

function getRemainingAttempts() {
    const data = getLoginAttempts();
    return Math.max(0, MAX_LOGIN_ATTEMPTS - data.attempts);
}

function clearLoginAttempts() {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
}

// Manejar login
function handleLogin(event) {
    event.preventDefault();
    console.log('handleLogin ejecutado');
    
    // 🔒 NIVEL 1: Verificar si está bloqueado por intentos fallidos
    if (isLoginBlocked()) {
        logSecurityEvent('Login bloqueado', { razon: 'Demasiados intentos fallidos' });
        showMessage('login', '🔒 Acceso bloqueado. Demasiados intentos fallidos. Intenta de nuevo en 5 minutos.', true);
        return;
    }
    
    // 🔒 NIVEL 2: Obtener y sanitizar inputs
    const usuarioRaw = document.getElementById('login-user').value;
    const passwordRaw = document.getElementById('login-password').value;
    
    const usuario = sanitizeInput(usuarioRaw).toLowerCase();
    const password = passwordRaw; // No sanitizar contraseña (respeta caracteres especiales)
    
    console.log('Usuario sanitizado:', usuario);
    
    // 🔒 NIVEL 3: Validar que no estén vacíos
    if (!usuario || !password) {
        logSecurityEvent('Intento de login inválido', { razon: 'Campos vacíos' });
        showMessage('login', '⚠️ Completa todos los campos', true);
        return;
    }
    
    // 🔒 NIVEL 4: Validar longitud máxima
    if (usuario.length > MAX_USERNAME_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        logSecurityEvent('Intento de login con campos demasiado largos', { usuario_length: usuario.length });
        showMessage('login', '⚠️ Los campos exceden la longitud permitida', true);
        return;
    }
    
    // 🔒 NIVEL 5: INTENTA LOGIN CON SERVIDOR (MySQL)
    console.log('📤 Intentando login en servidor...');
    
    fetch('api/usuarios.php?action=login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            usuario: usuario,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log('❌ Login fallido en servidor:', data.error);
            const attempts = recordFailedAttempt();
            const remaining = getRemainingAttempts();
            
            logSecurityEvent('Intento de login fallido en servidor', { 
                usuario: usuario,
                intento: attempts,
                error: data.error
            });
            
            if (remaining > 0) {
                showMessage('login', `❌ ${data.error} ${remaining} intentos restantes.`, true);
            } else {
                showMessage('login', '🔒 Acceso bloqueado. Demasiados intentos fallidos. Intenta de nuevo en 5 minutos.', true);
            }
        } else {
            console.log('✅ Login exitoso en MySQL:', data.usuario);
            clearLoginAttempts();
            
            // Guardar usuario del servidor
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.usuario));
            logSecurityEvent('Login exitoso en servidor', { 
                usuario: data.usuario.usuario, 
                rol: data.usuario.rol,
                fingerprint: getDeviceFingerprint()
            });
            
            showMessage('login', '✅ Iniciando sesión...', false);
            resetSessionTimeout();
            
            setTimeout(() => {
                console.log('Redirigiendo a index.html');
                window.location.href = 'index.html';
            }, 500);
        }
    })
    .catch(error => {
        // ⚠️ FALLBACK: Si el servidor no está disponible, usar localStorage
        console.warn('⚠️ Servidor no disponible. Intentando login en localStorage:', error);
        
        initUsers();
        const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        console.log('🔍 Usuarios disponibles en localStorage:', users.map(u => ({ usuario: u.usuario, email: u.email, rol: u.rol })));
        console.log('🔍 Buscando usuario:', usuario);
        
        // 🔒 NIVEL 6: Buscar usuario (por usuario o email) y validar contraseña
        const user = users.find(u => {
            const usuarioMatch = u.usuario.toLowerCase() === usuario;
            const emailMatch = u.email.toLowerCase() === usuario;
            const passwordMatch = u.password === password;
            
            console.log(`🔍 Verificando ${u.usuario}:`, { usuarioMatch, emailMatch, passwordMatch });
            
            return (usuarioMatch || emailMatch) && passwordMatch;
        });
        
        if (user) {
            // 🔒 NIVEL 7: Verificar integridad del usuario
            if (!verifyUserIntegrity(user)) {
                logSecurityEvent('Login fallido', { razon: 'Datos de usuario inválidos', usuario: user.usuario });
                showMessage('login', '❌ Error en los datos de autenticación', true);
                recordFailedAttempt();
                return;
            }
            
            console.log('✅ Login exitoso en localStorage para:', user.usuario);
            
            // 🔒 NIVEL 8: Limpiar intentos fallidos y registrar login exitoso
            clearLoginAttempts();
            logSecurityEvent('Login exitoso en localStorage', { usuario: user.usuario, rol: user.rol, fingerprint: getDeviceFingerprint() });
            
            // Guardar usuario actual
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            
            showMessage('login', '✅ Iniciando sesión...', false);
            
            // Inicializar session timeout
            resetSessionTimeout();
            
            // Redirigir a index.html después de 500ms
            setTimeout(() => {
                console.log('Redirigiendo a index.html');
                window.location.href = 'index.html';
            }, 500);
        } else {
            // ❌ Credenciales incorrectas
            const attempts = recordFailedAttempt();
            const remaining = getRemainingAttempts();
            
            console.log('❌ Credenciales incorrectas. Intento', attempts, 'de', MAX_LOGIN_ATTEMPTS);
            
            logSecurityEvent('Intento de login fallido en localStorage', { 
                usuario: usuario,
                intento: attempts
            });
            
            if (remaining > 0) {
                showMessage('login', `❌ Usuario o contraseña incorrectos. ${remaining} intentos restantes.`, true);
            } else {
                showMessage('login', '🔒 Acceso bloqueado. Demasiados intentos fallidos. Intenta de nuevo en 5 minutos.', true);
            }
        }
    });
}

// Login especial de admin

// Manejar registro
function handleRegister(event) {
    event.preventDefault();
    
    // 🔒 NIVEL 1: Sanitizar inputs
    const nombre = sanitizeInput(document.getElementById('registro-name').value);
    const email = sanitizeInput(document.getElementById('registro-email').value).toLowerCase();
    const usuario = sanitizeInput(document.getElementById('registro-user').value).toLowerCase();
    const password = document.getElementById('registro-password').value;
    
    console.log('Registro iniciado para:', usuario);
    
    // 🔒 NIVEL 2: Validar campos no vacíos
    if (!nombre || !email || !usuario || !password) {
        logSecurityEvent('Intento de registro inválido', { razon: 'Campos vacíos' });
        showMessage('registro', '⚠️ Completa todos los campos', true);
        return;
    }
    
    // 🔒 NIVEL 3: Validar formato de email
    if (!validateEmail(email)) {
        logSecurityEvent('Intento de registro con email inválido', { email: email });
        showMessage('registro', '⚠️ El email no es válido', true);
        return;
    }
    
    // 🔒 NIVEL 4: Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
        logSecurityEvent('Intento de registro con contraseña débil', { usuario: usuario });
        showMessage('registro', `⚠️ Contraseña débil. Requiere: mayúsculas, minúsculas, números y caracteres especiales`, true);
        return;
    }
    
    if (password.length < 8) {
        logSecurityEvent('Intento de registro con contraseña corta', { usuario: usuario });
        showMessage('registro', '⚠️ La contraseña debe tener mínimo 8 caracteres', true);
        return;
    }
    
    if (password.length > MAX_PASSWORD_LENGTH) {
        logSecurityEvent('Intento de registro con contraseña demasiado larga', { usuario: usuario });
        showMessage('registro', '⚠️ La contraseña es demasiado larga', true);
        return;
    }
    
    // 🔒 NIVEL 5: Validar longitud de usuario
    if (usuario.length < 3 || usuario.length > MAX_USERNAME_LENGTH) {
        logSecurityEvent('Intento de registro con usuario inválido', { usuario: usuario });
        showMessage('registro', `⚠️ El usuario debe tener entre 3 y ${MAX_USERNAME_LENGTH} caracteres`, true);
        return;
    }
    
    // 🔒 NIVEL 6: Validar longitud de nombre
    if (nombre.length < 2 || nombre.length > 100) {
        logSecurityEvent('Intento de registro con nombre inválido', { nombre: nombre });
        showMessage('registro', '⚠️ El nombre debe tener entre 2 y 100 caracteres', true);
        return;
    }
    
    // 🔒 NIVEL 7: Intenta registrar en servidor (con fallback a localStorage)
    // 💾 INTENTA GUARDAR EN MYSQL
    console.log('📤 Enviando registro al servidor...');
    
    fetch('api/usuarios.php?action=register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nombre: nombre,
            email: email,
            usuario: usuario,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            logSecurityEvent('Registro fallido en servidor', { usuario: usuario, error: data.error });
            showMessage('registro', `❌ ${data.error}`, true);
        } else {
            console.log('✅ Usuario registrado en MySQL:', data.usuario);
            logSecurityEvent('Nuevo usuario registrado en servidor', { usuario: usuario, email: email });
            showMessage('registro', `✓ ¡Cuenta creada! Usuario: ${usuario}`);
            
            // Limpiar formulario
            document.getElementById('registro-form').reset();
            
            // Cambiar a login después de 1.5 segundos
            setTimeout(() => {
                document.getElementById('login-user').value = usuario;
                switchTab('login');
            }, 1500);
        }
    })
    .catch(error => {
        // ⚠️ FALLBACK: Si el servidor no está disponible, guardar en localStorage
        console.warn('⚠️ Servidor no disponible. Guardando en localStorage:', error);
        
        initUsers();
        const users = JSON.parse(localStorage.getItem(USERS_KEY));
        
        // Verificar si el usuario ya existe
        if (users.some(u => u.usuario.toLowerCase() === usuario)) {
            logSecurityEvent('Intento de registro duplicado', { usuario: usuario });
            showMessage('registro', '❌ Este usuario ya está registrado', true);
            return;
        }
        
        if (users.some(u => u.email.toLowerCase() === email)) {
            logSecurityEvent('Intento de registro con email duplicado', { email: email });
            showMessage('registro', '❌ Este email ya está registrado', true);
            return;
        }
        
        // 🔒 NIVEL 8: Crear nuevo usuario con integridad verificada
        const newUser = {
            id: Math.max(...users.map(u => u.id), 0) + 1,
            nombre: nombre,
            email: email,
            usuario: usuario,
            password: password,
            rol: 'usuario',
            fecha_creacion: new Date().toISOString(),
            verificado: false
        };
        
        // Verificar integridad antes de guardar
        if (!verifyUserIntegrity(newUser)) {
            logSecurityEvent('Error de integridad al registrar usuario', { usuario: usuario });
            showMessage('registro', '❌ Error al crear la cuenta', true);
            return;
        }
        
        // Agregar a la lista
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // Registrar evento de seguridad
        logSecurityEvent('Nuevo usuario registrado en localStorage', { usuario: usuario, email: email, rol: 'usuario' });
        
        // Mensaje de éxito
        showMessage('registro', `✓ ¡Cuenta creada! Usuario: ${usuario} (localStorage)`);
        
        // Limpiar formulario
        document.getElementById('registro-form').reset();
        
        // Cambiar a login después de 1.5 segundos
        setTimeout(() => {
            document.getElementById('login-user').value = usuario;
            switchTab('login');
        }, 1500);
    });
}

// Obtener usuario actual
function getCurrentUser() {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    if (!user) return null;
    
    const parsedUser = JSON.parse(user);
    
    // 🔒 Verificar integridad del usuario en sesión
    if (!verifyUserIntegrity(parsedUser)) {
        console.warn('⚠️ Usuario en sesión con integridad comprometida');
        logSecurityEvent('Usuario en sesión con integridad comprometida', { usuario: parsedUser ? parsedUser.usuario : 'Desconocido' });
        logout();
        return null;
    }
    
    return parsedUser;
}

// Logout
function logout() {
    console.log('Logout ejecutado');
    
    // 🔒 NIVEL 1: Obtener usuario actual antes de limpiar
    const user = getCurrentUser();
    
    // 🔒 NIVEL 2: Registrar logout en logs de seguridad
    if (user) {
        logSecurityEvent('Logout', { 
            usuario: user.usuario, 
            rol: user.rol,
            fingerprint: getDeviceFingerprint()
        });
    } else {
        logSecurityEvent('Logout sin usuario activo', { });
    }
    
    // 🔒 NIVEL 3: Limpiar session timeout
    if (window.sessionTimeoutId) {
        clearTimeout(window.sessionTimeoutId);
    }
    
    // 🔒 NIVEL 4: Limpiar datos de sesión
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(SESSION_TIMEOUT_KEY);
    
    // 🔒 NIVEL 5: Limpiar intentos de login para permitir nuevo login
    clearLoginAttempts();
    
    console.log('✓ Sesión limpiada correctamente');
    
    // Redirigir al login
    window.location.href = 'login.html';
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    const authenticated = getCurrentUser() !== null;
    console.log('isAuthenticated:', authenticated);
    return authenticated;
}

// Obtener rol del usuario actual
function getCurrentUserRole() {
    const user = getCurrentUser();
    return user ? user.rol : null;
}

// Verificar si el usuario es admin
function isAdmin() {
    return getCurrentUserRole() === 'admin';
}

// Redirigir al login si no está autenticado
function requireAuth() {
    console.log('requireAuth ejecutada');
    if (!isAuthenticated()) {
        console.log('No autenticado, redirigiendo a login');
        window.location.href = 'login.html';
    } else {
        console.log('Autenticado, permitiendo acceso');
    }
}

// ═════════════════════════════════════════════════════════════
// SISTEMA DE AUTENTICACIÓN DE DOS PASOS (2FA)
// ═════════════════════════════════════════════════════════════

// Generar código aleatorio de 6 dígitos
function generateTwoFACode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Iniciar proceso de 2FA
function initiate2FA(user) {
    console.log('Iniciando 2FA para usuario:', user.usuario);
    
    // Generar código
    const code = generateTwoFACode();
    
    // Guardar código y usuario temporalmente
    localStorage.setItem(TWO_FA_CODE, code);
    localStorage.setItem(TWO_FA_USER_KEY, JSON.stringify(user));
    localStorage.setItem(TWO_FA_ATTEMPTS_KEY, '0');
    
    // Guardar timestamp para expiración
    localStorage.setItem('webcraft_2fa_timestamp', Date.now().toString());
    
    console.log('Código 2FA generado:', code);
    
    // Mostrar pantalla de verificación
    showTwoFAVerification(code);
}

// Mostrar pantalla de verificación 2FA
function showTwoFAVerification(code) {
    console.log('Mostrando pantalla 2FA');
    
    // Ocultar login y registro
    const loginEl = document.getElementById('login');
    const registroEl = document.getElementById('registro');
    
    if (loginEl) loginEl.style.display = 'none';
    if (registroEl) registroEl.style.display = 'none';
    
    // Obtener o crear pantalla 2FA
    let twoFAScreen = document.getElementById('two-fa-screen');
    
    if (!twoFAScreen) {
        twoFAScreen = document.createElement('div');
        twoFAScreen.id = 'two-fa-screen';
        twoFAScreen.className = 'content active';
        
        // Insertar en el contenedor principal después de los tabs
        const container = document.querySelector('.container');
        container.appendChild(twoFAScreen);
    }
    
    twoFAScreen.style.display = 'block';
    twoFAScreen.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">🔐 Verificación de Dos Pasos</h2>
            <p style="color: #666; margin-bottom: 10px;">Se ha enviado un código de verificación</p>
            <p style="color: #999; font-size: 0.9rem; margin-bottom: 20px;">Ingresa el código de 6 dígitos para continuar</p>
            
            <form id="two-fa-form" onsubmit="verify2FA(event)" style="display: flex; flex-direction: column; gap: 20px;">
                <input 
                    type="text" 
                    id="two-fa-code" 
                    placeholder="000000" 
                    maxlength="6"
                    inputmode="numeric"
                    style="font-size: 2rem; text-align: center; letter-spacing: 10px; padding: 15px; border: 2px solid #667eea; border-radius: 5px;"
                    required
                    autofocus
                >
                
                <div id="two-fa-message" style="padding: 12px; border-radius: 5px; display: none; font-weight: bold;"></div>
                
                <button type="submit" class="btn btn-primary">Verificar Código</button>
                
                <button type="button" class="btn btn-secondary" onclick="cancelTwoFA()">
                    Cancelar
                </button>
                
                <p style="color: #999; font-size: 0.85rem; margin-top: 10px;">
                    ⏱️ El código expira en 5 minutos
                </p>
            </form>
        </div>
    `;
    
    console.log('Pantalla 2FA mostrada. Código: ' + code);
    console.log('🔐 Código 2FA para desarrollo: ' + code);
}

// Verificar código 2FA
function verify2FA(event) {
    event.preventDefault();
    
    const enteredCode = document.getElementById('two-fa-code').value;
    const storedCode = localStorage.getItem(TWO_FA_CODE);
    const userJSON = localStorage.getItem(TWO_FA_USER_KEY);
    const timestamp = localStorage.getItem('webcraft_2fa_timestamp');
    
    // Verificar si el código ha expirado
    if (Date.now() - parseInt(timestamp) > TWO_FA_TIMEOUT) {
        show2FAMessage('❌ Código expirado. Intenta nuevamente.', true);
        cancelTwoFA();
        return;
    }
    
    // Contar intentos
    let attempts = parseInt(localStorage.getItem(TWO_FA_ATTEMPTS_KEY)) || 0;
    
    if (attempts >= MAX_2FA_ATTEMPTS) {
        show2FAMessage('❌ Demasiados intentos fallidos. Intenta de nuevo en un momento.', true);
        setTimeout(() => {
            cancelTwoFA();
        }, 2000);
        return;
    }
    
    // Verificar código
    if (enteredCode === storedCode) {
        // Código correcto
        const user = JSON.parse(userJSON);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        
        // Limpiar datos 2FA
        localStorage.removeItem(TWO_FA_CODE);
        localStorage.removeItem(TWO_FA_USER_KEY);
        localStorage.removeItem(TWO_FA_ATTEMPTS_KEY);
        localStorage.removeItem('webcraft_2fa_timestamp');
        
        show2FAMessage('✓ ¡Verificación exitosa!', false);
        
        // Redirigir después de 1 segundo
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        // Código incorrecto
        attempts++;
        localStorage.setItem(TWO_FA_ATTEMPTS_KEY, attempts.toString());
        const remainingAttempts = MAX_2FA_ATTEMPTS - attempts;
        
        if (remainingAttempts > 0) {
            show2FAMessage(`❌ Código incorrecto. ${remainingAttempts} intento${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}.`, true);
        } else {
            show2FAMessage('❌ Demasiados intentos fallidos.', true);
            setTimeout(() => {
                cancelTwoFA();
            }, 2000);
        }
    }
}

// Mostrar mensaje en 2FA
function show2FAMessage(message, isError = false) {
    const messageEl = document.getElementById('two-fa-message');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.style.background = isError ? '#ffebee' : '#e8f5e9';
        messageEl.style.color = isError ? '#c62828' : '#2e7d32';
        messageEl.style.display = 'block';
        console.log('Mensaje 2FA:', message);
    }
}

// Cancelar 2FA y volver a login
function cancelTwoFA() {
    console.log('Cancelando 2FA');
    
    // Limpiar datos 2FA
    localStorage.removeItem(TWO_FA_CODE);
    localStorage.removeItem(TWO_FA_USER_KEY);
    localStorage.removeItem(TWO_FA_ATTEMPTS_KEY);
    localStorage.removeItem('webcraft_2fa_timestamp');
    
    // Mostrar login nuevamente
    const twoFAScreen = document.getElementById('two-fa-screen');
    if (twoFAScreen) {
        twoFAScreen.style.display = 'none';
    }
    
    const loginEl = document.getElementById('login');
    const registroEl = document.getElementById('registro');
    
    if (loginEl) loginEl.style.display = 'block';
    if (registroEl) registroEl.style.display = 'none';
    
    // Limpiar campos
    document.getElementById('login-user').value = '';
    document.getElementById('login-password').value = '';
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('auth.js DOMContentLoaded');
    initUsers();
    
    // Configurar formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            handleLogin(e);
        });
    }
    
    // Configurar formulario de registro
    const registroForm = document.getElementById('registro-form');
    if (registroForm) {
        registroForm.addEventListener('submit', function(e) {
            handleRegister(e);
        });
    }
    
    // Configurar tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.textContent.includes('Iniciar') ? 'login' : 'registro';
            switchTab(tabName);
        });
    });
});
