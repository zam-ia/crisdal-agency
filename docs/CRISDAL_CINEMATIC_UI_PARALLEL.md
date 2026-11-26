# Crisdal — componentes cinematográficos reutilizables para UX/UI

**Rama:** `parallel/crisdal-cinematic-ui` (basada en `b8b037a566e7de45bbfe407de970aad5f5afa02b`).

## Alcance y uso

- `CinematicGallery`: galería editorial eventos-first con fotografías protagonistas, proporciones variadas, metadatos y enlaces hacia fichas de proyectos.
- Lightbox nativo `<dialog>` con botones anterior/siguiente, Esc, flechas, focus restoration y fondo oscuro. No necesita dependencias nuevas.
- `LiquidGlassLink`: acción tipo glass con desplazamiento ligero de luz líquida (`::before`); sin WebGL ni JS costoso.
- CSS aislado bajo `app/ui/cinematic/cinematic.module.css`, contraste sobre fondos reales, `prefers-reduced-motion` y fallback sin soporte de `backdrop-filter`.
- `safeGalleryItems` y `curateCinematicGallery`: filtrado de datos incompletos y jerarquía bodas/eventos antes de negocios, sin alterar la data de origen.
- No se generaron fotos, videos, clientes ni cifras ficticias. Las rutas e imágenes son props del componente y deben venir del portafolio público autorizado.

## Integración segura

1. Codex está modificando `/portafolio` en fases 4D/5A. **No cambiar esa ruta en esta rama**. Revisar el PR después de que Codex termine.
2. Reusar `CinematicGallery` para destacados, sección de eventos, listado público o ficha de proyecto, adaptando `PortfolioProject` existente a `CinematicGalleryItem` sin divulgar datos internos.
3. Pasar únicamente imágenes publicadas y autorizadas. La luz tipo glass se aplica a controles, no a las caras/fotografías.
4. Sustituir / preparar optimización de imágenes según el CDN y las reglas `next/image` existentes; la implementación usa `<img>` por compatibilidad con URLs públicas de Storage.
5. Evitar imágenes grandes innecesarias: Codex debe añadir `sizes`/`srcset` o `next/image` con remotePatterns tras confirmar hosting. No se diseñó una librería nueva de imágenes ni se amplió el payload de terceros.
6. Ejecutar `npm test`, `npm run lint`, `tsc --noEmit` y `npm run build`, más pruebas visuales 390/768/1280 y teclado/screen reader.
7. Revisar experiencia real del usuario antes de incorporar componentes: la galería no debe competir con la narrativa visual ya implementada por Codex.

## Validación

- 3 pruebas puras de curation en Node 22, sin instalar dependencias.
- Parseo sintáctico TS/TSX local correcto.
- Ningún cambio a Supabase, autenticación, base de datos, secretos, `/ruta-crisdal`, `/admin`, ni producción.
- No se ejecutó build/lint integral por no tener instaladas dependencias de la app localmente.
