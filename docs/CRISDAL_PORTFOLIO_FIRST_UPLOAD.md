# CRISDAL — Primera publicación real en el portafolio

> Estado vigente en la [entrega operativa diaria](CRISDAL_DAILY_OPERATIONS_RELEASE.md). Las 11 migraciones están aplicadas y el perfil propietario está activo. La sesión nominal y la publicación del primer trabajo se validan con el propietario.


Este documento prepara el trabajo del administrador; **no es una publicación automática** ni prueba de que Supabase esté operativo. Basado en el código publicado de `/panel/portafolio` y en las imágenes de la publicación de Facebook compartidas por el propietario el 26-11-2026.

## Estado actual comprobable

- El sitio público puede mostrar contenido real si se publica un proyecto.
- El panel `/panel/portafolio` requiere una sesión nominal con permiso `portfolio.manage`.
- Para guardar trabajos y fotografías, Crisdal OS necesita Supabase configurado y las migraciones correspondientes aplicadas y verificadas.
- La imagen de Facebook aportada es **una captura de una publicación**, no una foto original de calidad ni una URL canónica; no guardarla como portada de producción.
- No hay URL de la publicación de Facebook o TikTok en los archivos facilitados en este chat. Obtenerla con el botón de compartir/copy link del post original.
- Que una fotografía aparezca en Facebook no sustituye la comprobación documental de que su difusión en la web propia está autorizada.

## Material mínimo recomendado para el primer proyecto: una boda real

- **Portada:** fotografía original autorizada de la pareja, con buen encuadre y espacio suficiente para recorte responsive (no capturas de Facebook).
- **Selección:** entre 6 y 12 fotografías representativas de la cobertura, no todos los JPG. La captura muestra retratos de la novia y su pareja, detalles de preparación y parte de la ceremonia; escoger originales que representen esos momentos si los tenemos.
- **Video:** una URL oficial de Reel/TikTok/YouTube/Vimeo ya publicado cuando esté autorizada. Facebook mantiene enlace externo como fallback mientras el nuevo soporte social sea validado.
- **Datos:** categoría `Bodas`; título editorial, año real y descripción breve. No identificar personas, iglesia o local si no están autorizados.
- **Consentimiento:** prueba guardada, alcance para web/portafolio/redes, fecha y permiso explícito para nombres si se utilizan.
- **Conversión:** CTA `Consultar fecha`; el visitante podrá ir desde la ficha a `/consultar-fecha` o WhatsApp.

## Flujo real de administrador

1. Confirmar que `/panel/login` permite entrar con una cuenta de Crisdal OS autorizada. Si aparece `Activación pendiente`, no forzar datos ni escribir directamente en SQL desde el navegador.
2. Entrar en `/panel/portafolio` → `Nuevo proyecto`.
3. **Servicio:** seleccionar `Bodas`.
4. **Información:** título, slug, descripción editorial, año real y tipo de servicio.
5. **Galería:** guardar borrador; subir originales web (JPG/PNG/WebP/AVIF) usando carga privada firmada. Límite individual actual de 12 MB; la app crea derivados WebP/miniatura sin modificar rostros. Comprobar confirmación de cada archivo.
6. **Videos:** introducir URL pública oficial (YouTube/Vimeo/TikTok/Facebook), título, texto alternativo, orientación 9:16 o 16:9; no pegar HTML. Si Facebook se abre como enlace externo, no declarar que reproduce integrado.
7. **Portada:** seleccionar una fotografía de la galería; revisar recorte móvil y escritorio.
8. **Autorización:** seleccionar `verified` solo si el respaldo existe, documentar alcance y fecha. No publicar nombre de cliente sin permiso específico.
9. **Publicación:** revisar vista previa, publicar, abrir enlace sin login y compartir por WhatsApp. Verificar que al despublicar desaparezca la copia pública.
10. Revisar que el hero de inicio tome el primer trabajo destacado de eventos autorizado y que sus fotografías carguen sin datos privados.

## Borrador editorial OPCIONAL (revisar antes de publicar)

**Título interno sugerido:** `Boda · Cobertura fotográfica` (reemplazar por título editorial propio).
**Resumen:** `Entre preparativos, miradas y palabras compartidas, nuestra cobertura reúne momentos de la ceremonia y retratos de una celebración que la pareja podrá volver a recordar.`

No atribuir ciudad, identidad, número de invitados ni servicios no observados. No se debe presentar como una ficha pública terminada hasta aprobar el material.

## Protección de la calidad visual y almacenamiento

- Priorizar selección de calidad: 6–12 fotos en lugar de un álbum completo.
- El portafolio público usa derivados optimizados; conservar los originales privados solo según el contrato y los requisitos de edición/entrega.
- Usar URLs externas para video en lugar de MP4 duplicados.
- No incorporar fotos de la captura de Facebook a la galería web: hay bordes de interfaz, compresión y baja resolución.
- La experiencia de descarga privada del PR #14 es distinta al portafolio de marketing: no mezclar buckets ni permisos.

## Checklist para desbloqueo operacional (Codex + propietario)

- [ ] Acceso al proyecto Supabase correcto verificado.
- [ ] Historial de migraciones inspeccionado, sin aplicar SQL a ciegas.
- [ ] Backup / rollback comprobado antes de producción.
- [ ] Usuario `owner` real con acceso probado.
- [ ] Bucket de borradores privado y políticas verificadas.
- [ ] Carga, confirmación, publicación y despublicación probadas.
- [ ] Primera autorización documental validada.
- [ ] Fotografías originales web aportadas y optimizadas.
- [ ] Enlace real de publicación social añadido y reproducido/proporcionado con fallback.
- [ ] Home y ficha pública revisadas 390px y 1440px.

