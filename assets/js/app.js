// Datos simulados (fallback si no hay base de datos)
const catalogProducts = [
    { id: 1, nombre: 'Sitio Web Profesional', precio: 1200, emoji: '🌐', descripcion: 'Sitio web completo responsive con 5-10 páginas' },
    { id: 2, nombre: 'Aplicación Web Avanzada', precio: 2000, emoji: '💻', descripcion: 'Aplicación web con base de datos y panel administrativo' },
    { id: 3, nombre: 'Diseño Gráfico Logo', precio: 300, emoji: '🎨', descripcion: 'Diseño de logo profesional con variaciones' },
    { id: 4, nombre: 'Identidad de Marca', precio: 1500, emoji: '✨', descripcion: 'Paquete completo de branding y manual de marca' },
    { id: 5, nombre: 'App iOS Profesional', precio: 3500, emoji: '📱', descripcion: 'Aplicación nativa para iPhone optimizada' },
    { id: 6, nombre: 'App Android Profesional', precio: 3500, emoji: '🤖', descripcion: 'Aplicación nativa para Android optimizada' },
    { id: 7, nombre: 'Página Web Profesional', precio: 1200, emoji: '🌍', descripcion: 'Sitio web optimizado para SEO y conversiones' },
    { id: 8, nombre: 'Publicidad Digital', precio: 800, emoji: '📢', descripcion: 'Campañas en redes sociales y Google Ads' },
    { id: 9, nombre: 'Producción de Videos', precio: 2500, emoji: '🎬', descripcion: 'Videos profesionales para marketing' },
];

const userOrders = [
    { id: 'ORD-001', date: '2026-01-15', product: 'Sitio Web Básico', status: 'completed', amount: 500 },
    { id: 'ORD-002', date: '2026-02-01', product: 'Diseño Gráfico Logo', status: 'processing', amount: 300 },
    { id: 'ORD-003', date: '2026-02-10', product: 'Aplicación Web Avanzada', status: 'pending', amount: 2000 },
];

const messages = [
    { type: 'received', text: '¡Hola! ¿En qué puedo ayudarte?', time: '14:30' },
    { type: 'sent', text: 'Quería preguntar sobre el sitio web personalizado', time: '14:35' },
    { type: 'received', text: 'Claro, cuéntame más sobre lo que necesitas', time: '14:40' },
];

// API endpoints
const API_BASE = 'http://localhost:9999/api'; // Puerto que no existe, para forzar fallback
const ID_USUARIO = 1; // ID del usuario actual (demo)

// Carrito de compras
let shoppingCart = [];

// Cargar carrito desde LocalStorage
function loadCart() {
    const saved = localStorage.getItem('webcraft_cart');
    shoppingCart = saved ? JSON.parse(saved) : [];
}

// Guardar carrito en LocalStorage
function saveCart() {
    localStorage.setItem('webcraft_cart', JSON.stringify(shoppingCart));
    updateCartBadge();
}

// Función para cambiar de página
function showPage(pageId, event) {
    // Prevenir comportamiento por defecto
    if (event) {
        event.preventDefault();
    }
    
    console.log('Mostrando página:', pageId);
    
    // Ocultar todas las páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Mostrar la página seleccionada
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
        console.log('Página ' + pageId + ' mostrada');
        
        // Cargar contenido dinámico según la página
        if (pageId === 'catalogo') {
            loadCatalog();
        } else if (pageId === 'carrito') {
            loadShoppingCart();
        } else if (pageId === 'estado-compras') {
            loadOrders();
        } else if (pageId === 'comunicacion') {
            loadMessages();
        }
    } else {
        console.error('Página no encontrada:', pageId);
    }
}

// Cargar catálogo
function loadCatalog() {
    const catalogGrid = document.getElementById('catalog-grid');
    catalogGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;">Cargando productos...</div>';
    
    // Usar timeout para fallback rápido a datos simulados
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject('Timeout'), 1000)
    );
    
    // Intentar cargar desde API con timeout
    Promise.race([
        fetch(`${API_BASE}/productos.php`)
            .then(response => {
                if (!response.ok) throw new Error('API no disponible');
                return response.json();
            }),
        timeoutPromise
    ])
    .then(data => {
        // Si la API tiene datos, usarlos
        if (Array.isArray(data) && data.length > 0) {
            renderProducts(data);
        } else {
            // Si no hay datos, usar fallback simulado
            renderProducts(catalogProducts);
        }
    })
    .catch(error => {
        console.warn('Usando datos simulados (API no disponible)');
        // Usar datos simulados como fallback
        renderProducts(catalogProducts);
    });
}

// Renderizar productos en la grilla
function renderProducts(products) {
    const catalogGrid = document.getElementById('catalog-grid');
    catalogGrid.innerHTML = '';
    
    if (!Array.isArray(products) || products.length === 0) {
        catalogGrid.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">No hay productos disponibles</p>';
        return;
    }
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        const emoji = product.emoji || '📦';
        const nombre = product.nombre || product.name || 'Producto sin nombre';
        const precio = parseFloat(product.precio || product.price || 0).toFixed(2);
        const descripcion = product.descripcion || product.description || '';
        
        productCard.innerHTML = `
            <div class="product-image">${emoji}</div>
            <div class="product-info">
                <div class="product-name">${nombre}</div>
                <div class="product-price">$${precio}</div>
                <div class="product-description">${descripcion}</div>
                <button class="btn btn-add" onclick="addToCart(${product.id})">Agregar al Carrito</button>
            </div>
        `;
        catalogGrid.appendChild(productCard);
    });
}

// Agregar al carrito
function addToCart(productId) {
    // Buscar si ya existe en el carrito
    const cartItem = shoppingCart.find(p => p.id === productId);
    
    if (cartItem) {
        // Si ya existe, incrementar cantidad
        cartItem.quantity += 1;
    } else {
        // Buscar producto en datos simulados
        let foundProduct = catalogProducts.find(p => p.id === productId);
        
        if (foundProduct) {
            // Agregar nuevo producto al carrito
            shoppingCart.push({
                id: foundProduct.id,
                name: foundProduct.nombre,
                price: parseFloat(foundProduct.precio),
                emoji: foundProduct.emoji,
                quantity: 1
            });
        }
    }
    
    saveCart();
    
    // Mostrar notificación
    const productName = catalogProducts.find(p => p.id === productId)?.nombre || 'Producto';
    showNotification(`✓ "${productName}" agregado al carrito`);
}

// Función para mostrar notificación
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remover después de 2 segundos
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Actualizar el badge del carrito
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
}

// Cargar carrito de compras
function loadShoppingCart() {
    const cartContent = document.getElementById('cart-content');
    
    if (shoppingCart.length === 0) {
        cartContent.innerHTML = `
            <div class="cart-items">
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <h2>Tu carrito está vacío</h2>
                    <p>Agregá productos desde el catálogo</p>
                    <button class="btn btn-primary" onclick="showPage('catalogo')" style="margin-top: 1.5rem;">Ir al Catálogo</button>
                </div>
            </div>
        `;
        return;
    }
    
    let cartItemsHTML = '<div class="cart-items">';
    
    shoppingCart.forEach(item => {
        cartItemsHTML += `
            <div class="cart-item">
                <div class="cart-item-image">${item.emoji}</div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name || item.nombre || 'Producto sin nombre'}</div>
                    <div class="cart-item-price">$${(item.price || item.precio || 0).toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button onclick="decreaseQuantity(${item.id})">−</button>
                        <div class="quantity-display">${item.quantity}</div>
                        <button onclick="increaseQuantity(${item.id})">+</button>
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${item.id})">Eliminar</button>
                </div>
            </div>
        `;
    });
    
    cartItemsHTML += '</div>';
    
    // Calcular totales
    const subtotal = shoppingCart.reduce((sum, item) => sum + ((item.price || item.precio || 0) * item.quantity), 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax;
    
    const summaryHTML = `
        <div class="cart-summary">
            <div class="summary-title">Resumen del Pedido</div>
            <div class="summary-row">
                <span class="summary-label">Subtotal:</span>
                <span class="summary-value">$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">IVA (10%):</span>
                <span class="summary-value">$${tax.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <div class="summary-total">
                    <span>Total:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
            <div class="cart-actions">
                <button class="checkout-btn" onclick="checkout()">Proceder al Pago</button>
                <button class="continue-shopping-btn" onclick="showPage('catalogo')">Seguir Comprando</button>
            </div>
        </div>
    `;
    
    cartContent.innerHTML = cartItemsHTML + summaryHTML;
}

// Aumentar cantidad
function increaseQuantity(productId) {
    const item = shoppingCart.find(item => item.id === productId);
    if (item) {
        item.quantity += 1;
        saveCart();
        loadShoppingCart();
    }
}

// Disminuir cantidad
function decreaseQuantity(productId) {
    const item = shoppingCart.find(item => item.id === productId);
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        saveCart();
        loadShoppingCart();
    }
}

// Eliminar del carrito
function removeFromCart(productId) {
    shoppingCart = shoppingCart.filter(item => item.id !== productId);
    saveCart();
    loadShoppingCart();
}

// Proceder al checkout
function checkout() {
    if (shoppingCart.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    const user = getCurrentUser();
    const subtotal = shoppingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxTotal = subtotal * 0.10;
    const grandTotal = subtotal + taxTotal;
    
    // Crear orden para cada item
    const allOrders = JSON.parse(localStorage.getItem('webcraft_orders')) || [];
    
    shoppingCart.forEach(item => {
        const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        const order = {
            id: orderId,
            usuario: user ? user.usuario : 'Anónimo',
            producto: item.name,
            cantidad: item.quantity,
            monto: item.price * item.quantity,
            fecha: new Date().toISOString(),
            estado: 'pendiente'
        };
        
        allOrders.push(order);
    });
    
    // Guardar en localStorage
    localStorage.setItem('webcraft_orders', JSON.stringify(allOrders));
    
    // Mostrar confirmación
    alert(`✅ Orden completada!\nTotal: $${grandTotal.toFixed(2)}\n\nEsta versión guarda los datos localmente.\nEn producción se integraría un sistema de pagos.`);
    
    // Limpiar carrito
    shoppingCart = [];
    saveCart();
    
    // Ir a estado de compras
    showPage('estado-compras');
    loadOrders();
    
    // Recargar panel admin si hay
    loadAdminOrders();
}

// Cargar órdenes
function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    const user = getCurrentUser();
    
    // Obtener órdenes del localStorage
    const allOrders = JSON.parse(localStorage.getItem('webcraft_orders')) || [];
    
    // Filtrar por usuario actual
    const userOrders = allOrders.filter(order => order.usuario === (user ? user.usuario : 'Anónimo'));
    
    if (userOrders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">No tienes órdenes aún</p>';
        return;
    }
    
    ordersList.innerHTML = userOrders.map(order => {
        const statusClass = `status-${order.estado}`;
        const statusText = {
            'pendiente': '⏳ Pendiente',
            'confirmado': '✅ Confirmado',
            'completado': '✓ Completado',
            'cancelado': '✗ Cancelado'
        }[order.estado] || order.estado;
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">Orden: ${order.id}</div>
                    <div class="order-status ${statusClass}">${statusText}</div>
                </div>
                <div class="order-details">
                    <div class="detail-item">
                        <div class="detail-label">Producto</div>
                        <div class="detail-value">${order.producto}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Cantidad</div>
                        <div class="detail-value">${order.cantidad}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Fecha</div>
                        <div class="detail-value">${new Date(order.fecha).toLocaleDateString('es-ES')}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Monto</div>
                        <div class="detail-value">$${order.monto.toFixed(2)}</div>
                    </div>
                    <div class="detail-item">
                        <button class="btn btn-secondary" onclick="showPage('comunicacion', event)">Contactar Soporte</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Buscar orden
function searchOrder() {
    const searchInput = document.getElementById('order-search').value.toLowerCase();
    const orderCards = document.querySelectorAll('.order-card');
    
    orderCards.forEach(card => {
        const orderId = card.querySelector('.order-id').textContent.toLowerCase();
        if (orderId.includes(searchInput) || searchInput === '') {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Cargar mensajes
function loadMessages() {
    const messagesContainer = document.getElementById('messages-container');
    const user = getCurrentUser();
    const username = user ? user.usuario : 'Anónimo';
    
    // Obtener conversaciones
    const conversations = JSON.parse(localStorage.getItem('webcraft_conversations')) || {};
    const messages = conversations[username] || [];
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;">No hay mensajes. ¡Inicia una conversación!</div>';
        return;
    }
    
    messagesContainer.innerHTML = messages.map(msg => {
        const fecha = new Date(msg.fecha);
        const time = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
        const msgType = msg.tipo === 'usuario' ? 'sent' : 'received';
        
        return `
            <div class="message ${msgType}">
                <div class="message-content">
                    <div>${msg.texto}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Scroll al final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Enviar mensaje
function sendMessage(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    
    if (messageText === '') return;
    
    // Obtener conversaciones
    const conversations = JSON.parse(localStorage.getItem('webcraft_conversations')) || {};
    const username = user ? user.usuario : 'Anónimo';
    
    if (!conversations[username]) {
        conversations[username] = [];
    }
    
    // Agregar mensaje del usuario
    conversations[username].push({
        tipo: 'usuario',
        texto: messageText,
        fecha: new Date().toISOString()
    });
    
    // Guardar
    localStorage.setItem('webcraft_conversations', JSON.stringify(conversations));
    
    // Limpiar input
    messageInput.value = '';
    
    // Recargar mensajes
    loadMessages();
    
    console.log('Mensaje enviado por:', username);
}

// Función para contactar al vendedor desde una orden
function contactSupport(orderId) {
    alert(`Abriendo chat sobre la orden: ${orderId}`);
    showPage('comunicacion', event);
}

// Manejar envío del formulario de pedido personalizado
document.addEventListener('DOMContentLoaded', function() {
    const customOrderForm = document.getElementById('custom-order-form');
    if (customOrderForm) {
        customOrderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                nombre: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email').value,
                tipo: document.getElementById('product-type').value,
                descripcion: document.getElementById('description').value,
                presupuesto: document.getElementById('budget').value,
                fecha_entrega: document.getElementById('deadline').value
            };
            
            // Enviar al backend
            fetch(`${API_BASE}/pedidos_personalizados.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                } else {
                    alert('✓ Tu pedido personalizado ha sido enviado. Nos pondremos en contacto pronto.');
                    customOrderForm.reset();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al enviar el pedido');
            });
        });
    }
    
    // Permitir búsqueda con Enter
    const orderSearch = document.getElementById('order-search');
    if (orderSearch) {
        orderSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchOrder();
            }
        });
    }
});

// Cargar catálogo al iniciar
window.addEventListener('load', function() {
    loadCart();
    updateCartBadge();
    loadCatalog();
    updateUserInfo();
    initializeAdminPanel();
    loadMessages();
});

// Actualizar información del usuario en el navbar
function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const userNameEl = document.getElementById('user-name');
        const userRoleEl = document.getElementById('user-role');
        
        if (userNameEl) {
            userNameEl.textContent = user.nombre;
        }
        
        if (userRoleEl) {
            if (user.rol === 'admin') {
                userRoleEl.innerHTML = '<span class="admin-badge">👨‍💼 Admin</span>';
            } else {
                userRoleEl.innerHTML = '<span class="user-badge">👤 Usuario</span>';
            }
        }
    }
}

// ═════════════════════════════════════════════════════════════
// FUNCIONES DE ADMINISTRADOR
// ═════════════════════════════════════════════════════════════

// Inicializar panel admin si es admin
function initializeAdminPanel() {
    const user = getCurrentUser();
    const adminPanel = document.getElementById('admin-panel');
    
    if (user && user.rol === 'admin' && adminPanel) {
        adminPanel.style.display = 'block';
        console.log('Panel admin mostrado para:', user.usuario);
        loadAdminProducts();
        loadAdminOrders();
        loadAdminMessages();
    }
}

// Mostrar/ocultar tabs del admin
function showAdminTab(tabName) {
    // Ocultar todos los tabs
    const contents = document.querySelectorAll('.admin-tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    // Ocultar botones activos
    const buttons = document.querySelectorAll('.admin-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar tab seleccionado
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Marcar botón como activo
    event.target.classList.add('active');
}

// ADMINISTRAR PRODUCTOS
function addProductAdmin(event) {
    event.preventDefault();
    
    const name = document.getElementById('admin-product-name').value;
    const price = parseFloat(document.getElementById('admin-product-price').value);
    const description = document.getElementById('admin-product-desc').value;
    const icon = document.getElementById('admin-product-icon').value || '📦';
    
    // Crear nuevo producto
    const newProduct = {
        id: catalogProducts.length + 1,
        nombre: name,
        precio: price,
        descripcion: description,
        emoji: icon
    };
    
    // Agregar al catálogo
    catalogProducts.push(newProduct);
    
    // Guardar en localStorage
    localStorage.setItem('webcraft_catalog', JSON.stringify(catalogProducts));
    
    // Mensaje de éxito
    const messageEl = document.getElementById('admin-product-message');
    messageEl.textContent = '✅ Producto agregado exitosamente: ' + name;
    messageEl.classList.add('success');
    messageEl.classList.remove('error');
    messageEl.style.display = 'block';
    
    // Limpiar formulario
    document.getElementById('admin-product-form').reset();
    
    // Recargar catálogo
    loadCatalog();
    
    console.log('Nuevo producto agregado:', newProduct);
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

function loadAdminProducts() {
    console.log('Productos cargados:', catalogProducts.length);
}

// GESTIONAR PEDIDOS
function loadAdminOrders() {
    const user = getCurrentUser();
    if (!user || user.rol !== 'admin') return;
    
    const ordersList = document.getElementById('admin-orders-list');
    if (!ordersList) return;
    
    // Obtener todos los pedidos del localStorage
    const allOrders = JSON.parse(localStorage.getItem('webcraft_orders')) || [];
    
    if (allOrders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No hay pedidos aún</p>';
        return;
    }
    
    ordersList.innerHTML = allOrders.map(order => `
        <div class="admin-order-item">
            <div class="order-info">
                <h4>Pedido #${order.id}</h4>
                <p><strong>Usuario:</strong> ${order.usuario}</p>
                <p><strong>Producto:</strong> ${order.producto}</p>
                <p><strong>Fecha:</strong> ${new Date(order.fecha).toLocaleDateString('es-ES')}</p>
                <p><strong>Monto:</strong> $${order.monto}</p>
            </div>
            <div class="order-status status-${order.estado}">
                ${order.estado.toUpperCase()}
            </div>
            <div class="order-actions">
                <select onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pendiente" ${order.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="confirmado" ${order.estado === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                    <option value="completado" ${order.estado === 'completado' ? 'selected' : ''}>Completado</option>
                    <option value="cancelado" ${order.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
        </div>
    `).join('');
}

function filterOrdersAdmin(status) {
    // Actualizar botones activos
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const allOrders = JSON.parse(localStorage.getItem('webcraft_orders')) || [];
    const ordersList = document.getElementById('admin-orders-list');
    
    let filteredOrders = allOrders;
    if (status !== 'todos') {
        filteredOrders = allOrders.filter(order => order.estado === status);
    }
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No hay pedidos en este estado</p>';
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="admin-order-item">
            <div class="order-info">
                <h4>Pedido #${order.id}</h4>
                <p><strong>Usuario:</strong> ${order.usuario}</p>
                <p><strong>Producto:</strong> ${order.producto}</p>
                <p><strong>Fecha:</strong> ${new Date(order.fecha).toLocaleDateString('es-ES')}</p>
                <p><strong>Monto:</strong> $${order.monto}</p>
            </div>
            <div class="order-status status-${order.estado}">
                ${order.estado.toUpperCase()}
            </div>
            <div class="order-actions">
                <select onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pendiente" ${order.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="confirmado" ${order.estado === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                    <option value="completado" ${order.estado === 'completado' ? 'selected' : ''}>Completado</option>
                    <option value="cancelado" ${order.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
        </div>
    `).join('');
}

function updateOrderStatus(orderId, newStatus) {
    const allOrders = JSON.parse(localStorage.getItem('webcraft_orders')) || [];
    const orderIndex = allOrders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        allOrders[orderIndex].estado = newStatus;
        localStorage.setItem('webcraft_orders', JSON.stringify(allOrders));
        console.log('Estado de pedido actualizado:', orderId, newStatus);
        loadAdminOrders();
    }
}

// MENSAJES ADMIN
function loadAdminMessages() {
    const user = getCurrentUser();
    if (!user || user.rol !== 'admin') return;
    
    const messagesList = document.getElementById('admin-users-list');
    if (!messagesList) return;
    
    // Obtener conversaciones
    const conversations = JSON.parse(localStorage.getItem('webcraft_conversations')) || {};
    const users = Object.keys(conversations);
    
    if (users.length === 0) {
        messagesList.innerHTML = '<p style="padding: 1rem; color: #999;">Sin mensajes</p>';
        return;
    }
    
    messagesList.innerHTML = users.map((username, index) => `
        <div class="admin-user-item ${index === 0 ? 'active' : ''}" onclick="showAdminConversation('${username}', this)">
            <strong>${username}</strong>
            <small style="display: block; color: #999; font-size: 0.85rem;">
                ${new Date(conversations[username][conversations[username].length - 1].fecha).toLocaleDateString()}
            </small>
        </div>
    `).join('');
    
    // Mostrar primera conversación
    if (users.length > 0) {
        showAdminConversation(users[0]);
    }
}

function showAdminConversation(username, element) {
    const conversations = JSON.parse(localStorage.getItem('webcraft_conversations')) || {};
    const messages = conversations[username] || [];
    
    const chatBox = document.getElementById('admin-chat-messages');
    if (!chatBox) return;
    
    // Marcar como activo
    const items = document.querySelectorAll('.admin-user-item');
    items.forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');
    
    // Mostrar mensajes
    chatBox.innerHTML = messages.map(msg => `
        <div class="admin-message ${msg.tipo === 'usuario' ? 'user' : 'admin'}">
            <strong>${msg.tipo === 'usuario' ? username : 'Tú'}:</strong> ${msg.texto}
            <br><small style="opacity: 0.7;">${new Date(msg.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
    `).join('');
    
    // Scroll al final
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Guardar username actual para la respuesta
    document.getElementById('admin-reply-form').dataset.currentUser = username;
}

function sendAdminReply(event) {
    event.preventDefault();
    
    const username = event.target.dataset.currentUser;
    const replyText = document.getElementById('admin-reply-input').value;
    
    if (!replyText.trim()) return;
    
    // Obtener conversaciones
    const conversations = JSON.parse(localStorage.getItem('webcraft_conversations')) || {};
    
    if (!conversations[username]) {
        conversations[username] = [];
    }
    
    // Agregar mensaje del admin
    conversations[username].push({
        tipo: 'admin',
        texto: replyText,
        fecha: new Date().toISOString()
    });
    
    // Guardar
    localStorage.setItem('webcraft_conversations', JSON.stringify(conversations));
    
    // Limpiar input
    document.getElementById('admin-reply-input').value = '';
    
    // Recargar conversación
    showAdminConversation(username);
    
    console.log('Respuesta enviada a:', username);
}

// Inicializar cuando carga la página
window.addEventListener('DOMContentLoaded', () => {
    initializeAdminPanel();
});
