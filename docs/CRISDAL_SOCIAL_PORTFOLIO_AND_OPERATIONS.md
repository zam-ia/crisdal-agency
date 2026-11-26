# Crisdal Agency — portafolio social y activación operativa

Fecha de validación: 26 de noviembre de 2026.

## Resultado de esta rama

La rama `codex/crisdal-social-operations` integra de forma selectiva las mejoras visuales, de recorrido comercial y consentimiento que estaban separadas de `main`, y añade el soporte de publicaciones sociales solicitado. No modifica tarifas, no publica casos sin autorización y no descarga videos de redes en Supabase.

### 1. Operativo y validado en código

- Logo transparente, favicon de marca y acceso flotante a WhatsApp en páginas comerciales, sin insertarlo en `/admin` ni `/panel`.
- Recorrido público simplificado entre inicio, portafolio, paquetes, consulta de fecha y WhatsApp.
- Medición de marketing cerrada por defecto: sin aceptación explícita no se envían eventos desde cliente ni desde `/api/lead`.
- Parser HTTPS con lista cerrada para:
  - Instagram: publicaciones `/p/` y reels `/reel/`.
  - Facebook: posts, videos, reels y `watch`.
  - TikTok: `@usuario/video/id` y reproductor oficial.
  - YouTube: videos, Shorts y URLs cortas.
  - Vimeo: video público por identificador.
- Normalización de enlaces y eliminación de parámetros de seguimiento innecesarios.
- Tarjeta universal de contenido externo con composición responsive, orientación editorial y fallback al enlace original.
- Ningún iframe social se crea antes de que el visitante pulse `Cargar desde…`; no hay autoplay ni sonido automático.
- No se usa `dangerouslySetInnerHTML`, `srcDoc` ni HTML devuelto por terceros.
- El panel de portafolio acepta una URL oficial, reconoce el proveedor, permite enlace externo o carga bajo consentimiento y admite una publicación social autorizada como portada sin inventar miniaturas.
- El modelo distingue `image`, `video` y `social`, además del tipo editorial `photo`, `carousel`, `post`, `reel` o `video`.

### 2. Implementado y pendiente de activación

- `20261126190000_crisdal_social_portfolio.sql` amplía de forma aditiva `media_assets` para Instagram y publicaciones sociales.
- Las siete migraciones comerciales/operativas anteriores siguen sin figurar en el historial remoto de Supabase. La base productiva conserva tablas heredadas y un CMS real fuera del historial de migraciones.
- El código falla cerrado si esas tablas no existen: el sitio no fabrica portafolio, disponibilidad ni persistencia comercial.

La migración social no debe ejecutarse sola: requiere que el esquema comercial base exista y haya sido reconciliado.

### 3. Bloqueado por causa exacta

- No se verificó un respaldo recuperable ni un procedimiento de restauración del proyecto `CRISDAL LANDING` (`emdheaugznkzskrgkyaw`). Por ese motivo no se aplicó SQL remoto.
- No existe una rama de base de datos aislada disponible sin confirmar primero su costo. Tampoco se ejecutó una creación facturable sin aprobación específica.
- No se publicaron casos sociales reales porque no se proporcionaron en esta entrega URLs canónicas y evidencia de autorización para uso web.
- Las entregas privadas del PR #14 permanecen separadas. Su código requiere probar RLS, sesiones revocadas, expiración, favoritos, descargas y medios privados en staging antes de integrarlo.
- Finanzas y cotizaciones paralelas siguen siendo simuladores sin persistencia validada; no se presentan como módulos operativos.

### 4. Pendiente de desarrollo o activación posterior

1. Confirmar respaldo y recuperación de Supabase.
2. Ensayar todas las migraciones en instalación limpia y en un estado legado con `landing_content_versions` existente e historial vacío.
3. Aplicar por etapas: identidad → portafolio/paquetes → agenda/solicitudes → publicación social.
4. Probar con datos ficticios los permisos `owner`, usuario sin capacidad y sesión revocada.
5. Cargar el primer caso real solo con originales autorizados, URL social canónica y alcance de consentimiento documentado.
6. Revisar selectivamente las entregas privadas en staging; integrarlas en una rama y PR independientes.

## Decisiones de seguridad y rendimiento

- Se almacena la URL canónica; no se copia el MP4 de Instagram, Facebook, TikTok, YouTube o Vimeo.
- Las miniaturas externas arbitrarias no se cargan en la tarjeta previa. Solo se admite como poster automático un recurso HTTPS de Supabase; de lo contrario se muestra una composición local del proveedor.
- Los dominios parecidos (`instagram.com.ejemplo.com`), credenciales embebidas, HTTP, JavaScript URLs y rutas de perfil no compatibles son rechazados.
- Los reproductores se construyen exclusivamente desde identificadores o URLs normalizadas por el parser.
- El HTML de oEmbed no se persiste ni se inyecta. Aunque Meta permite oEmbed público sin token desde el 15 de junio de 2026, la implementación evita convertir esa respuesta en ejecución de scripts dentro del dominio.

Documentación oficial contrastada:

- Meta: [Embedded Posts](https://developers.facebook.com/documentation/plugins/embedded-posts), [Embedded Videos](https://developers.facebook.com/docs/plugins/embedded-video-player/) y [Instagram oEmbed](https://developers.facebook.com/docs/graph-api/reference/instagram-oembed).
- TikTok: [Embed Player](https://developers.tiktok.com/docs/en/embed-player).
- YouTube: [Embedded Players and Player Parameters](https://developers.google.com/youtube/player_parameters).
- Vimeo: [Player SDK](https://developer.vimeo.com/player/sdk/basics).

## Validación ejecutada

- `npm ci`: correcto, 353 paquetes, 0 vulnerabilidades informadas.
- `npm run lint`: correcto.
- `npx tsc --noEmit --incremental false`: correcto.
- `npm test`: 84 pruebas correctas, 0 fallos.
- `npm run build`: correcto con Next.js 16.4.6.
- QA local en 320, 390, 768, 1280 y 1440 px: sin desbordamiento horizontal; banner de consentimiento y WhatsApp flotante no se superponen.
- Recorridos comprobados en 390 y 1440 px: `/`, `/portafolio`, `/paquetes`, `/consultar-fecha`, `/panel/portafolio` (redirección segura a login) y `/ruta-crisdal`.

## Plan de reversión

- Código: revertir los commits funcionales de esta rama o cerrar el PR sin fusionar.
- Base de datos: no hay nada que revertir en producción porque no se ejecutó SQL remoto.
- La migración social es aditiva; cuando se programe su aplicación, el rollback debe prepararse sobre una copia aislada y no debe eliminar columnas con datos sin exportación y respaldo verificado.
