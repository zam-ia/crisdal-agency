# Portafolio: asistente compacto y guiado

Respuesta a captura del propietario del paso 2. Cambios en PR #29, sin tocar producción ni migraciones.

- Modal nativo centrado con ancho máximo 57rem; navegación compacta, acciones táctiles y adaptación móvil.
- Datos principales visibles: nombre, servicio, año opcional y descripción. URL automática (se conserva al editar), frase pública y nombre autorizado en detalles opcionales. Guías y ejemplos por campo. No es necesario entender el término slug.
- Se aclara el mínimo de 3 caracteres para el nombre, 20 para descripción, 2 para servicio, año 2000–2100 opcional. Validación con esquema existente; no se relajan restricciones de publicación.
- El guardado conserva el paso y cola de archivos. Carga y publicación guardan datos pendientes primero; se bloquea publicación mientras haya fotos o enlace social sin añadir. Aviso antes de descartar.
- Guías de formatos 12 MB, redes, orientación y consentimiento. Reordenamiento de publicaciones filtradas usa IDs del orden completo en lugar de índices incorrectos.
- QA pendiente: npm lint, typecheck, test, build, diálogo y restauración de foco, navegación 320/390/768/1440, guardado y recarga real, carga múltiple y reintento, enlace social, autorización, publicación y despublicación. Validar también concurrencia de mutaciones de medios del PR general.
- No afirmar que el Preview ni el sistema productivo están actualizados hasta verificar deploy. No modificar esquema.
