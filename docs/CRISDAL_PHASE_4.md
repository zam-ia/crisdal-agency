# Crisdal Agency — Fase 4

Fecha de validación local: 25 de noviembre de 2026

Rama: `codex/crisdal-premium-os`

Base: `b067a43070fcb3797b26afa019587c8a312c0911`

## Resumen ejecutivo

La Fase 4 entrega el MVP comercial de Crisdal: un portafolio audiovisual editorial, un catálogo de paquetes y un flujo para generar selecciones privadas y compartirlas por WhatsApp. Los módulos públicos funcionan sin cuenta; toda lectura privada y mutación administrativa exige una sesión nominal y capacidades de Crisdal OS.

El código, las migraciones y las pruebas están terminados. La persistencia real del panel continúa deliberadamente desactivada hasta aplicar, en orden, la migración de identidad de Fase 3 y las dos migraciones comerciales de esta fase. No se ejecutaron migraciones, no se crearon usuarios ni se publicaron datos reales.

## Funciones implementadas

### Portafolio

- `/portafolio` con hero editorial, filtros funcionales, destacados, estado vacío honesto y diseño responsive.
- `/portafolio/[slug]` con información autorizada, galería mixta, video bajo demanda, relacionados, copiar enlace, compartir nativo y WhatsApp contextual.
- `/panel/portafolio` para crear, editar, guardar borrador, publicar, despublicar, archivar, cargar imágenes, enlazar videos aprobados, seleccionar portada y reordenar medios.
- Verificación de autorización documentada antes de publicar. El nombre del cliente requiere autorización específica.
- Imágenes de hasta 12 MB verificadas por firma, normalizadas con Sharp y almacenadas como WebP. Los videos pesados se mantienen en YouTube o Vimeo aprobados.

### Paquetes

- `/paquetes` con líneas de contenido y eventos, filtros, tarjetas diferenciadas, selección y consulta contextual al `51992566725`.
- Se preservan los precios aprobados: Impulso S/ 899, Crecimiento S/ 1,199 y Dominio Digital S/ 1,599. Los paquetes de eventos permanecen en “Consultar precio”.
- `/panel/paquetes` para crear, editar, ordenar, publicar, despublicar y archivar; permite mostrar, ocultar o consultar precio y exige aprobación explícita de entregables.
- Selector compartible con filtros Todos, Contenido, Fotografía, Bodas, Quinceaños y Eventos.
- Enlaces no listados en `/paquetes/compartir/[token]`. El token aleatorio se entrega una sola vez y la base guarda únicamente su SHA-256.
- Mensaje editable y acciones Vista previa, Copiar, Compartir y WhatsApp. No se registran vistas ni conversiones inventadas.

### Integración administrativa

- Navegación de Crisdal OS condicionada por `portfolio.manage`, `packages.read`, `packages.write` y `users.manage`.
- Validación de sesión, capacidad y origen/CSRF en servidor para cada API administrativa.
- Auditoría de guardado, estado, orden, carga de imagen, video y generación de enlaces.
- El sitio público conserva Home, Contenido, Eventos, Planes, Contacto, Ruta Crisdal, consentimiento, Pixel/CAPI y UTMs.

## Estructura principal

```text
app/
  api/panel/{portfolio,packages,package-links}/
  lib/commercial/
    api-auth.ts
    portfolio*.ts
    package*.ts
  panel/{portafolio,paquetes}/
  portafolio/[slug]/
  paquetes/compartir/[token]/
supabase/
  migrations/20261125150000_crisdal_commercial_portfolio.sql
  migrations/20261125160000_crisdal_commercial_packages.sql
  tests/crisdal_commercial_rls.sql
tests/
  portfolio-*.test.ts
  packages-*.test.ts
  commercial-migrations.test.ts
```

## Modelo de datos

- `portfolio_categories`: taxonomía administrable.
- `media_assets`: metadatos de imágenes públicas autorizadas o referencias de video externas.
- `portfolio_projects`: ficha, slug, estado, portada y datos editoriales.
- `portfolio_media`: relación y orden de medios.
- `publication_consents`: estado, alcance, fecha y referencia del respaldo.
- `commercial_packages`: línea, precio en unidades menores, visibilidad, entregables, estado y notas internas.
- `package_share_links`: hash del token, campaña, selección, mensaje, creador, expiración y revocación.

Las tablas activan RLS, revocan acceso directo a `anon` y `authenticated` y se consultan desde repositorios server-only. El bucket `crisdal-public-media` acepta únicamente imágenes y solo contiene activos autorizados para publicación.

## Rutas nuevas

| Ruta | Acceso | Función |
| --- | --- | --- |
| `/portafolio` | Pública | Proyectos publicados y filtros |
| `/portafolio/[slug]` | Pública | Ficha audiovisual publicada |
| `/paquetes` | Pública | Catálogo comercial |
| `/paquetes/compartir/[token]` | Pública no listada | Selección privada válida |
| `/panel/portafolio` | `portfolio.manage` | Administrador de proyectos |
| `/panel/paquetes` | `packages.read` / `packages.write` | Administrador comercial |
| `/api/panel/portfolio/*` | Sesión + capacidad + origen | Mutaciones y medios |
| `/api/panel/packages` | Sesión + capacidad + origen | CRUD, estados y orden |
| `/api/panel/package-links` | Sesión + capacidad + origen | Generación de enlaces |

## Pruebas y resultados

- Dominio y ciclo completo de proyecto: crear, editar, proteger borrador, autorizar, publicar, despublicar, cargar imagen, añadir video, ordenar y rechazar URL inválida.
- Dominio y ciclo de paquetes: crear, editar, activar, desactivar, precio visible/oculto/consulta, ordenar, compartir uno o varios, token inválido y protección de notas internas.
- Seguridad: capacidades, IDOR de perfiles, origen/CSRF, firma de archivos, proveedor de video, tokens hash-only y comprobación estática de RLS.
- SQL pgTAP reproducible para identidad y tablas comerciales. No se ejecutó contra producción.
- Compatibilidad prevista con rutas anteriores y CMS histórico; `/admin` no fue sustituido.
- QA visual local en escritorio y 390 px documentado en la revisión final de la rama.

Resultado local de cierre:

- ESLint: correcto, sin errores ni advertencias.
- TypeScript: correcto con `--incremental false`.
- Tests: 29/29 correctos.
- Build de producción: correcto con Next.js 16.4.6.
- Auditoría de dependencias de producción y completa: 0 vulnerabilidades.
- Rutas públicas principales: HTTP 200; slugs y tokens inválidos: HTTP 404.
- APIs administrativas sin sesión: HTTP 401; mutación desde origen no confiable: HTTP 403.
- Catálogo validado en 1280×800 y 390×844, con filtros operativos, WhatsApp contextual y sin overflow horizontal.
- Portafolio y login revisados en 390×844, con un solo `h1`, labels de acceso y consola sin errores.
- Vercel Preview generado correctamente para el commit de cierre: `https://crisdal-agency-biyisacwp-zam-ias-projects.vercel.app`. El deployment figura `success`, pero la protección de Vercel redirige visitantes no autorizados a su login; por ello la validación visual reproducible se realizó localmente sobre el mismo build.

Comandos de cierre: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, `npm audit --omit=dev` y `npm audit`.

## CÓMO PUBLICAR MI PRIMER PROYECTO

1. Aplicar primero las migraciones y crear el propietario siguiendo el procedimiento de activación de este documento.
2. Iniciar sesión en `/panel/login` y abrir **Portafolio**.
3. Pulsar **Nuevo proyecto**, completar título, categoría, descripción, objetivo y tipo de servicio; guardar el borrador.
4. Subir fotografías reales autorizadas. Cada imagen necesita texto alternativo; luego se puede ordenar y elegir como portada.
5. Si existe video, añadir únicamente una URL autorizada de YouTube o Vimeo y su descripción.
6. Registrar el alcance, la fecha y la referencia verificable de la autorización. Marcar el nombre del cliente solo si ese dato también está autorizado.
7. Pulsar **Publicar**. El servidor rechazará proyectos sin portada, medios o respaldo suficiente.
8. Abrir **Vista previa pública** y revisar texto, imágenes, video, móvil y WhatsApp.
9. En la ficha pública usar **Compartir proyecto** o **Copiar enlace**.

## CÓMO COMPARTIR MIS PAQUETES POR WHATSAPP

1. Entrar a `/panel/paquetes` y comprobar que los paquetes correctos estén publicados.
2. Pulsar **Compartir selección**.
3. Usar los filtros y marcar uno o varios paquetes.
4. Editar el mensaje para el cliente sin añadir precios, entregables o disponibilidad no confirmados.
5. Pulsar **Generar enlace privado** y abrir **Vista previa**.
6. Elegir **WhatsApp**, **Copiar** o **Compartir**. El destinatario verá solo la selección y no necesita iniciar sesión.
7. El enlace compartido no confirma reserva, fecha, pago ni venta.

## Activación controlada

1. Crear una rama o proyecto Supabase de prueba y respaldar el esquema actual.
2. Aplicar `20261125120000_crisdal_os_identity.sql`.
3. Ejecutar `crisdal_os_identity_rls.sql` y verificar roles/capacidades.
4. Aplicar, en orden, las migraciones de portafolio y paquetes.
5. Ejecutar `crisdal_commercial_rls.sql`.
6. Configurar en el entorno de preview `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` y `OS_AUDIT_PEPPER`; nunca exponer los valores ni prefijar secretos con `NEXT_PUBLIC_`.
7. Crear un único usuario propietario en Supabase Auth y su perfil `owner`; probar login, revocación y auditoría.
8. Cargar únicamente material real con autorización y verificar el bucket, fichas, enlaces y WhatsApp.
9. Solicitar aprobación explícita antes de promover a producción.

## Checklist de publicación y rollback

- [ ] Migraciones probadas en entorno aislado y respaldo confirmado.
- [ ] pgTAP de identidad y comercial sin fallos.
- [ ] Propietario nominal, permisos mínimos y revocación probada.
- [ ] Imágenes y videos reales autorizados; consentimientos verificables.
- [ ] Precios, entregables, condiciones y número de WhatsApp aprobados.
- [ ] Preview responsive revisado, sin errores de consola ni desbordamiento.
- [ ] Pixel/CAPI, consentimiento y UTMs validados sin exponer datos privados.
- [ ] Aprobación separada para producción.

Rollback: retirar primero los paquetes/proyectos a borrador, revocar enlaces compartidos, restaurar el despliegue Vercel anterior y, para base de datos, restaurar el respaldo o ejecutar un rollback revisado en una ventana controlada. No eliminar buckets ni tablas con contenido sin exportación y autorización explícita.

## Riesgos, dependencias y pendientes de producción

- La migración de identidad de Fase 3 sigue siendo dependencia obligatoria.
- Las migraciones comerciales están versionadas pero no aplicadas; por eso el panel muestra “Activación pendiente” en lugar de fingir guardado.
- No hay proyectos reales ni entregables nuevos en Git. Deben cargarse con autorización.
- Un enlace generado no prueba apertura ni conversión.
- El preview existe y su build terminó correctamente, pero está protegido por autenticación de Vercel. Para revisión externa se debe conceder acceso o ajustar la protección del entorno preview; no se modificó esa seguridad ni se desplegó producción.

## Commits

- `26eecaf` — `feat: build professional portfolio management` (Fase 4A).
- `4bd4f5e` — `feat: add shareable commercial package catalog` (Fase 4B).
- `chore: integrate and verify commercial mvp` (Fase 4C; commit de cierre de esta rama).

## Próxima fase

Activar primero Fases 3 y 4 en un entorno aislado con contenido autorizado. Agenda, reservas, finanzas y CRM permanecen fuera de alcance y no deben adelantarse hasta validar este MVP comercial.
