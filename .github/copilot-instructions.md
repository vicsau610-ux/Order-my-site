# Instrucciones de Copilot para WebCraft

## Descripción del Proyecto

WebCraft es un sitio web de gestión de pedidos con las siguientes características:
- Catálogo dinámico de productos
- Sistema de pedidos personalizados
- Seguimiento de estado de compras
- Chat en tiempo real con el vendedor

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Storage**: LocalStorage para datos persistentes
- **Arquitectura**: Single Page Application (SPA)

## Estructura de Carpetas

- `index.html` - Página principal con todas las secciones
- `assets/css/styles.css` - Estilos responsivos y modernos
- `assets/js/app.js` - Lógica de aplicación y manejo de datos
- `assets/images/` - Carpeta para imágenes y recursos
- `pages/` - Carpeta reservada para páginas adicionales

## Guías de Desarrollo

### Agregar Nueva Funcionalidad

1. **Para nuevos productos**: Modifica el array `catalogProducts` en `app.js`
2. **Para nuevas páginas**: Crea una nueva sección en `index.html` y añade lógica en `app.js`
3. **Para estilos**: Agrega nuevas clases en `styles.css`

### Características Implementadas

- ✅ Navegación entre secciones
- ✅ Catálogo con productos simulados
- ✅ Formulario de pedido personalizado
- ✅ Vista de órdenes con búsqueda
- ✅ Sistema de mensajes
- ✅ Diseño responsive

### Mejoras Planificadas

- Backend con Node.js/Express
- Base de datos MongoDB
- Sistema de autenticación JWT
- Integración de pagos Stripe
- Notificaciones por email
- Dashboard administrativo

## Convenciones de Código

- Usar nombres descriptivos en español para variables de negocio
- Comentarios claros en español
- Clases CSS en kebab-case
- Funciones en camelCase
- Mantener compatibilidad con navegadores antiguos

## Notas Importantes

- El sitio funciona sin backend (datos en memoria)
- Los datos se pierden al recargar (opcional: implementar LocalStorage)
- Todos los estilos son mobile-first
- No hay dependencias externas (vanilla JS)
