# WebCraft - Sistema de Gestión de Pedidos

Plataforma web segura para gestión de pedidos con autenticación, panel administrativo y base de datos MySQL.

## ✨ Características Principales

- ✅ **Autenticación Segura**: Login/registro con validaciones de seguridad
- ✅ **Catálogo de Productos**: 9 servicios digitales disponibles
- ✅ **Carrito de Compras**: Sistema persistente con localStorage
- ✅ **Panel Administrativo**: Gestión de productos, órdenes y mensajes
- ✅ **Sistema de Mensajes**: Comunicación directa con vendedor
- ✅ **Máxima Seguridad**: 8 capas de protección contra ataques
- ✅ **MySQL Integration**: Sincronización con base de datos

## 🔐 Seguridad Implementada

1. **Password Hashing** - Protección de contraseñas
2. **Password Strength Validation** - Validación de fortaleza
3. **Input Sanitization (XSS Prevention)** - Prevención de ataques
4. **Email Validation** - Validación de correos
5. **Session Timeout** - Cierre automático por inactividad (30min)
6. **Security Event Logging** - Registro de eventos
7. **User Data Integrity** - Verificación de integridad
8. **Device Fingerprinting** - Identificación de dispositivos
+ **Rate Limiting** - 3 intentos, 5 minutos de espera
+ **Role-Based Access Control** - Admin vs Usuario

## 🚀 Instalación Rápida

### Requisitos
- XAMPP (Apache + MySQL)
- Navegador moderno
- PHP 7.0+

### Pasos

1. **Colocar en XAMPP:**
   ```
   C:\xampp\htdocs\WebCraft\
   ```

2. **Crear Base de Datos:**
   - Abre phpMyAdmin: `http://localhost/phpmyadmin`
   - Selecciona "SQL" y copia el contenido de `database.sql`
   - Ejecuta la query

3. **Acceder:**
   - Login: `http://localhost/WebCraft/login.html`

## 👤 Credenciales de Administrador

| Campo | Valor |
|-------|-------|
| Usuario | `Anonymous` |
| Contraseña | `Blueroom@123` |
| Rol | Admin |

## 📁 Estructura del Proyecto

```
WebCraft/
├── login.html              # Página de autenticación
├── index.html              # Panel principal (requiere login)
├── limpiar-cache.html      # Herramienta para limpiar localStorage
├── database.sql            # Scripts de base de datos
├── README.md               # Este archivo
│
├── api/                    # Endpoints PHP
│   ├── config.php          # Configuración de BD
│   ├── usuarios.php        # Gestión de usuarios
│   ├── productos.php       # Gestión de productos
│   ├── ordenes.php         # Gestión de órdenes
│   └── mensajes.php        # Gestión de mensajes
│
├── assets/                 # Recursos del proyecto
│   ├── css/
│   │   └── styles.css      # Estilos responsive
│   ├── js/
│   │   ├── app.js          # Lógica principal
│   │   └── auth.js         # Autenticación y seguridad
│   └── images/             # Imágenes y recursos
│
├── .github/                # Configuración de GitHub
└── .vscode/                # Configuración de VS Code
```

## 🎯 Funcionalidades por Rol

### Admin (Anonymous)
- ➕ Agregar nuevos productos
- 📊 Ver todas las órdenes
- 💬 Gestionar mensajes con clientes
- 🔧 Panel administrativo completo

### Usuario Regular
- 🛒 Comprar productos
- 📝 Hacer pedidos personalizados
- 📦 Ver estado de compras
- 💬 Comunicarse con vendedor

## 🛠️ Tecnologías Utilizadas

| Tecnología | Propósito |
|------------|----------|
| HTML5 | Estructura |
| CSS3 | Estilos responsivos |
| JavaScript (ES6+) | Lógica frontend |
| PHP | Backend y APIs |
| MySQL | Base de datos |
| localStorage | Sincronización local |

## 📝 Almacenamiento de Datos

- **Usuarios**: MySQL + localStorage (fallback)
- **Órdenes**: localStorage + MySQL
- **Productos**: Catálogo en memoria + MySQL
- **Mensajes**: localStorage + MySQL
- **Logs de Seguridad**: localStorage

## 🔄 Flujo de Autenticación

```
1. Usuario llena credenciales en login.html
2. Se envía a api/usuarios.php (intenta MySQL primero)
3. Si MySQL no responde → fallback a localStorage
4. En ambos casos se validan 8 capas de seguridad
5. Si es válido → crea sesión en index.html
6. Session timeout automático a los 30 minutos
```

## ⚙️ Configuración MySQL

El archivo `database.sql` incluye:
- Tabla de `usuarios` (username, password, rol)
- Tabla de `productos` (catálogo)
- Tabla de `ordenes` (historial de compras)
- Tabla de `mensajes` (comunicación)

Para recrear:
```sql
mysql -u root < database.sql
```

## 🧹 Mantenimiento

### Limpiar localStorage
- Abre `limpiar-cache.html`
- Haz clic en "Limpiar Todo"
- Se eliminan datos locales

### Resetear Base de Datos
```sql
DROP DATABASE webcraft;
-- Ejecuta nuevamente database.sql
```

## 📞 Soporte

Para issues o consultas:
1. Revisa los logs de seguridad (F12 → Console)
2. Verifica la conexión MySQL
3. Limpia cache si hay problemas de login

## 📄 Licencia

Proyecto de demostración para gestión de pedidos.

---

**Última actualización:** 17 de febrero de 2026
