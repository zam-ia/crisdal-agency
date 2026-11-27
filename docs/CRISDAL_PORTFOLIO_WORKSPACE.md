# Editor de portafolio

- El editor se abre dentro del panel. Reúne datos del trabajo, fotografías, enlaces sociales, portada y autorización. La selección de categoría es un desplegable y la configuración global sigue disponible en el listado.
- Al añadir medios, el editor guarda primero los datos válidos del trabajo. Si debe corregirse algún campo, el foco vuelve a los datos y se conservan los archivos y enlaces pendientes. **Guardar borrador** guarda la ficha. Para incorporar medios, usa **Subir seleccionadas** o **Añadir enlace**.
- La URL reconoce el proveedor mediante el analizador existente. El título, la descripción accesible, la miniatura y el modo de presentación se pueden personalizar. Los enlaces se añaden uno por uno.
- La portada, el orden de medios y el permiso se revisan antes de publicar. Se conservan las cargas privadas, los reintentos, los enlaces públicos y los permisos existentes. Los diálogos compartidos se centran en escritorio y se abren desde abajo en móvil.
- El recorrido de propietario se probó con PostgreSQL y PostgREST aislados, una sesión de prueba y almacenamiento simulado. Se verificaron selección y reintento de varias fotografías, guardado previo, dos proveedores, portada, orden, borradores, rechazo sin permiso, publicación y retirada. Las pruebas visuales incluyeron claro y oscuro, 320, 390, 768, 1024 y 1440 px y un título largo.
