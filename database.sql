-- Base de datos para WebCraft
CREATE DATABASE IF NOT EXISTS webcraft;
USE webcraft;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin') DEFAULT 'usuario',
    telefono VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de productos/catálogo
CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    emoji VARCHAR(10),
    disponible BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de órdenes
CREATE TABLE ordenes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    numero_orden VARCHAR(20) UNIQUE NOT NULL,
    fecha_orden TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'procesando', 'completado', 'cancelado') DEFAULT 'pendiente',
    subtotal DECIMAL(10, 2),
    impuesto DECIMAL(10, 2),
    total DECIMAL(10, 2),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de items de órdenes
CREATE TABLE orden_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_orden INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2),
    subtotal DECIMAL(10, 2),
    FOREIGN KEY (id_orden) REFERENCES ordenes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE RESTRICT
);

-- Tabla de pedidos personalizados
CREATE TABLE pedidos_personalizados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_contacto VARCHAR(100) NOT NULL,
    email_contacto VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    tipo_producto VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    presupuesto DECIMAL(10, 2),
    fecha_entrega_deseada DATE,
    estado ENUM('nuevo', 'revisado', 'aceptado', 'en_desarrollo', 'completado', 'rechazado') DEFAULT 'nuevo',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT
);

-- Tabla de mensajes/comunicación
CREATE TABLE mensajes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    id_orden INT,
    tipo ENUM('usuario', 'vendedor') NOT NULL,
    contenido TEXT NOT NULL,
    fecha_mensaje TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes(id) ON DELETE SET NULL
);

-- Insertar usuario administrador
INSERT INTO usuarios (nombre, email, usuario, password, rol) VALUES
('Administrador', 'admin@webcraft.com', 'Anonymous', 'Blueroom@123', 'admin');

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (nombre, email, usuario, password, rol) VALUES
('Cliente Demo', 'cliente@example.com', 'cliente_demo', 'Password123!', 'usuario');

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, emoji) VALUES
('Sitio Web Básico', 'Sitio web profesional de 5 páginas', 500.00, '🌐'),
('Página Web Profesional', 'Sitio web completo con diseño moderno y responsivo', 1200.00, '🖥️'),
('Aplicación Web Avanzada', 'Aplicación web con base de datos y panel administrativo', 2000.00, '💻'),
('App Android', 'Aplicación nativa para dispositivos Android', 3500.00, '🤖'),
('App iOS', 'Aplicación nativa para dispositivos iPhone y iPad', 3500.00, '📱'),
('Publicidad Digital', 'Campañas de publicidad en redes sociales y Google Ads', 800.00, '📢'),
('Producción de Videos', 'Grabación, edición y producción de videos profesionales', 2500.00, '🎬'),
('Diseño Gráfico Logo', 'Diseño de logo profesional y versiones', 300.00, '🎨'),
('Identidad de Marca', 'Paquete completo de branding y manual de identidad', 1500.00, '✨');

-- Insertar órdenes de ejemplo
INSERT INTO ordenes (id_usuario, numero_orden, estado, subtotal, impuesto, total) VALUES
(1, 'ORD-001', 'completado', 500.00, 50.00, 550.00),
(1, 'ORD-002', 'procesando', 1200.00, 120.00, 1320.00),
(1, 'ORD-003', 'pendiente', 2500.00, 250.00, 2750.00);

-- Insertar items de órdenes
INSERT INTO orden_items (id_orden, id_producto, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 500.00, 500.00),
(2, 2, 1, 1200.00, 1200.00),
(3, 7, 1, 2500.00, 2500.00);

-- Insertar mensajes de ejemplo
INSERT INTO mensajes (id_usuario, id_orden, tipo, contenido) VALUES
(1, 1, 'vendedor', '¡Hola! ¿En qué puedo ayudarte?'),
(1, 1, 'usuario', 'Quería preguntar sobre el sitio web personalizado'),
(1, 1, 'vendedor', 'Claro, cuéntame más sobre lo que necesitas');
