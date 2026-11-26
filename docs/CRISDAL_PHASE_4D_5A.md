# Crisdal Agency — Fase 4D + Fase 5A

Fecha de implementación: 26 de noviembre de 2026.

## Alcance entregado

- Reposicionamiento público con eventos como prioridad editorial: hero, navegación, categorías, portafolio, paquetes, proceso, preguntas y contacto.
- El contenido para negocios sigue accesible como línea secundaria, sin eliminar rutas existentes.
- Catálogo público sin datos de respaldo obsoletos: distingue `ready`, `empty`, `unconfigured` y `unavailable`.
- Filtros de portafolio por categoría y formato, detalle cinematográfico, galería accesible y lightbox.
- Videos externos limitados a YouTube, Vimeo, TikTok y Facebook. No se acepta HTML arbitrario ni dominios parecidos. TikTok usa su reproductor oficial tras interacción; Facebook se presenta como enlace externo.
- Asistente administrativo de portafolio en siete pasos, responsive, con guardado progresivo, advertencia de cambios sin guardar, reordenamiento, portada, autorización y publicación.
- Carga múltiple directa a almacenamiento privado mediante URL firmada. El servidor verifica tamaño, MIME real y dimensiones, crea WebP optimizado y miniatura, y solo promueve el medio al bucket público al publicar un proyecto autorizado.
- Revocar o retirar un proyecto elimina la copia pública y conserva el original privado.
- Orden y visibilidad de categorías configurables desde el asistente.
- Promociones programables con fechas UTC, edición mostrada en hora de Lima, prioridad, páginas, formato y visibilidad móvil/escritorio. No hay temporizadores ni urgencia ficticia.
- Dashboard operativo base y agenda con vistas mes, semana y lista, estados reales y detección de superposición.

## Migraciones versionadas

- `supabase/migrations/20261125200000_crisdal_events_media_promotions.sql`
- `supabase/migrations/20261125210000_crisdal_agenda_base.sql`

Las migraciones crean recursos privados, habilitan RLS y revocan acceso directo a `anon` y `authenticated`. No fueron ejecutadas contra producción como parte de esta fase. Deben aplicarse primero en un entorno de Preview o rama de Supabase, comprobarse y recién después promoverse mediante el proceso de despliegue autorizado.

## Variables y secretos

No se añadieron secretos al repositorio. El código usa las variables ya previstas por el proyecto (`SUPABASE_URL` y `SUPABASE_SECRET_KEY` o la compatibilidad existente). Las credenciales deben permanecer en Supabase/Vercel.

## Estados honestos

- Sin migración o configuración: el panel muestra **Activación pendiente**.
- Sin paquetes o actividades: muestra un estado vacío, no contenido de demostración.
- Sin proyecto real autorizado para el hero: muestra un marco editorial neutro, no una imagen inventada.
- El dashboard solo cuenta actividades recibidas desde la base real.

## Validación

Comandos obligatorios:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Además, revisar en Preview los anchos 390, 768, 1280 y 1440 px; login y permisos del panel; publicación/despublicación; carga por archivo con reintento; consentimiento de reproductores; promociones activas/expiradas; y conflictos de agenda.

## Fuera de alcance deliberado

- Migraciones o datos reales en producción.
- Usuarios, proyectos, clientes, reservas, precios o métricas ficticios.
- Módulo financiero.
- Scraping o descarga de videos de redes sociales.
- Publicación directa a producción.
