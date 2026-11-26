# Crisdal OS — Entrega privada de fotografías a clientes

**Rama independiente:** `parallel/crisdal-client-delivery-galleries`

**Base:** `1b4f52bf758683515de93b8565eb615e5e4f6b67`

**Contexto:** Codex está integrando PR #10–13 y publicando el sitio principal. **No incorporar esta rama a producción durante ese proceso.**

## Resultado de esta entrega

Se implementó un MVP vertical de galería privada para fotografía de bodas, quinceaños, celebraciones, eventos corporativos y sesiones:

**Cliente**
- Ruta `/entregas/[token]` (sin login, enlace secreto de 256 bits).
- Galería editorial, mobile-first, lightbox y navegación por teclado.
- Favoritos guardados en la base y visibles al administrador (una selección compartida por enlace).
- Descarga individual de originales solamente si Crisdal la habilita.
- Video mediante enlace externo oficial de YouTube o Vimeo, **no almacenamiento privado de video**.
- Caducidad predeterminada de 30 días; todos los enlaces caducados/revocados devuelven 404.
- Metadata `noindex`/no-referrer y exclusión de Meta/GTM en `/entregas`.

**Administrador**
- Ruta `/panel/entregas` protegida por `projects.write`.
- Crear/editar entregas; definir tipo de evento, descripción y permiso de descargas.
- Carga múltiple de imágenes mediante ticket firmado con subida directa a `crisdal-private-media`. Original privado, derivado WebP y thumbnail.
- Previsualización de miniaturas firmadas, ordenar y retirar archivos, añadir enlaces de video.
- Publicar y generar enlace temporal; regenerarlo revoca el anterior; despublicar revoca acceso de inmediato.
- Ver selección de favoritos y progreso de cargas.
- Panel con estado de activación pendiente cuando Supabase no está configurado.

**Seguridad**
- La base almacena solo SHA-256 del token (token plaintext visible una vez).
- Consultas públicas restringidas a token válido, estado publicado y vencimiento futuro.
- RLS habilitado y acceso directo `anon`/`authenticated` revocado; acceso por servidor con service role.
- Fotos de borrador y publicadas almacenadas en **bucket privado** (no usar bucket de portafolio).
- Archivos servidos mediante URL firmada por 5 minutos; descargas individuales firmadas por 60 segundos.
- Las URLs emitidas previamente pueden permanecer válidas hasta vencer su firma, aunque se revoque la galería.
- No se muestran clientes, sus contactos, su dirección o el calendario interno.

## Archivos principales

```text
app/
  lib/deliveries/{domain,repository}.ts
  api/panel/deliveries/{route,uploads/route}.ts
  api/deliveries/[token]/{favorites/route,download/[assetId]/route}.ts
  panel/entregas/{page,deliveries-admin,deliveries-admin.module.css}
  entregas/{layout,[token]/page,[token]/delivery-gallery,[token]/delivery-gallery.module.css}
  ui/os/panel-shell.tsx             (solo nuevo ítem Entregas)
  ui/tracking-consent.tsx           (exclusión de entregas privadas)
supabase/migrations/20261126180000_crisdal_client_delivery_galleries.sql
tests/client-deliveries-{domain,sql}.test.ts
```

## Uso administrativo

1. Acceder a `/panel/entregas` con usuario autorizado.
2. Pulsar **Nueva entrega**, asignar nombre descriptivo sin datos sensibles, tipo de evento y descripción.
3. Guardar borrador.
4. Seleccionar varias fotografías (JPG/PNG/WebP/AVIF, máximo 12 MB cada una), esperar confirmación. Los medios se optimizan pero el original permanece en Storage privado.
5. Ordenar fotos y revisar miniaturas; añadir enlaces oficiales de video si corresponde.
6. Marcar/Desmarcar **Permitir descarga** según contrato y confirmación de entrega.
7. Publicar y **copiar el enlace inmediatamente**; solo su hash persiste en base. Si se pierde, pulsar **Regenerar enlace**, lo que revoca el anterior.
8. Entregar el enlace al cliente por el canal acordado y solicitar que no lo reenvíe.
9. Revisar las fotografías marcadas como favoritas; un mismo enlace comparte una lista de selección.
10. Al terminar, despublicar o dejar que caduque.

## Activación controlada

Esta migración depende de:
1. `20261125120000_crisdal_os_identity.sql`
2. `20261125200000_crisdal_events_media_promotions.sql` (bucket privado).

Aplicar primero en una base aislada. Ejecutar pgTAP/SQL y el flujo real; verificar que un usuario anónimo **no** puede listar objetos del bucket ni consultar las tablas directamente. No aplicar sobre producción sin respaldos y aprobación.

## Validación indispensable antes de merge

```bash
git fetch origin
git diff --stat origin/codex/crisdal-premium-os...origin/parallel/crisdal-client-delivery-galleries
npm ci
npm run lint
npx tsc --noEmit --incremental false
npm test
npm run build
```

Probar en navegadores reales 390px y 1440px, incluyendo:
- Sesión owner/production autorizada, otra sin `projects.write`, visita anónima a APIs privadas (401/403).
- Borrador no visible con URL; publicación; expiración; revocación; regeneración invalidando enlace anterior.
- Descarga habilitada/deshabilitada, URL firmada y vencimiento.
- Fotos con permisos, MIME falsificado, archivo >12MB, cambios parciales de carga, errores de Storage.
- Selección de favorito y actualización en administrador; filtros y lightbox accesibles.
- Ausencia de trackers en `/entregas` y de nombres privados en HTML/metadata.
- Verificación de costos para 100–500 fotografías; optimizar batched signed URLs si hay latencia.
- Validación real con SQL, carreras de concurrencia y limpieza de objetos huérfanos.

**Estado de pruebas:** se añadieron pruebas unitarias y estáticas SQL. **No se ha ejecutado** el build, lint, suite completa ni integración con Supabase en esta conversación; la rama precisa revisión/ejecución de Codex antes de utilizarla.

## Limitaciones y mejoras candidatas

- Los enlaces de video externos dependen de la configuración de privacidad de YouTube/Vimeo; **no son alojamiento privado**. Videos grandes en Storage deben utilizar TUS/resumable, transcodificación y control de costes en una fase posterior.
- No hay descarga ZIP completa, selección individual por invitado ni PIN separado; son mejoras posteriores.
- Una entrega privada protege el acceso de desconocidos pero no impide capturas, reenvíos del enlace o copias descargadas. Para material sensible, añadir verificación de destinatario/PIN.
- La galería sirve imágenes firmadas por cinco minutos; para visitas largas puede requerir renovar URLs dinámicamente o recargar página.
- Los tickets firmados pueden producir archivos huérfanos si el navegador abandona el proceso: programar limpieza periódica con auditoría. La edición de miles de imágenes necesita paginación y procesamiento asíncrono.
- Si los requisitos de retención del material difieren por contrato, la política de archivo y borrado debe definirse antes de activarla.
- Actualizar permisos en el modelo de RBAC si se desea `deliveries.manage` en lugar de reutilizar `projects.write`.
- Mejorar el manejo de errores y reintento de cargas parciales, además de asegurar que las transacciones de publicación/archivo se reconcilien con Storage.
- La guía de diseño `$crisdal-premium-ui` (PR #13) debe aplicarse durante el QA final sin importar archivos duplicados de galería pública (PR #12).

## Handoff seguro a Codex

Cuando termine la entrega comercial a `main`, pedir a Codex que compare este PR con el HEAD actualizado. Conservar la arquitectura de portfolio y calendario público, **no usar la misma tabla para galería privada y portafolio público**. Integrar solo tras pasar el pipeline y activar la migración en base de prueba. No hacer merge automático durante el despliegue existente.
