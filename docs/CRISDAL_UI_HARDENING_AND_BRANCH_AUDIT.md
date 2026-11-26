# Crisdal — UI hardening y consolidación de ramas

Base revisada: main bb4bd9955f2121f7aa8c2fbba9a991ae91806856 (2026-11-26).
La rama de UI se mantiene separada de PR #26 para no editar la rama que Codex está integrando. No se modificó producción ni Supabase.

## Cambios de UI

- AppShell: navegación móvil con tres accesos prioritarios según permisos reales y menú Más con todos los módulos permitidos. Antes se limitaba a los cinco primeros. Sidebar desplazable, ajuste del topbar, safe areas, foco y enlace para saltar al contenido.
- Menú comercial: disclosure nativo, cierra al seleccionar enlace, con Escape y clic fuera; se integra en el flujo flex del encabezado, evita posiciones absolutas frágiles en móvil.
- WhatsApp: conserva el icono, número y seguimiento actuales. Mide la altura real del consentimiento con ResizeObserver; no cambia su lógica de aceptación/rechazo. Mejor lectura y objetivos táctiles del banner.
- Hero: jerarquía tipográfica y altura más contenidas, marca decorativa oculta en móvil. Texto de espera del portafolio con contraste oscuro sobre superficie clara. Microinteracciones moderadas y respetuosas con movimiento reducido.
- Portafolio: fotos completas con object-fit contain, espacio 9:16 para TikTok y clips verticales, controles de al menos 44px, safe areas en lightbox y estado seguro cuando el parser rechaza una URL. No se crean imágenes ni proyectos ficticios.
- No se añadieron librerías nuevas ni precios/promociones, ni se alteraron modelos de datos.

## Inventario de ramas/PR

Al iniciar: 21 ramas incluyendo main y recuperación, 13 PR abiertos. Esta revisión añade únicamente la rama UI. Cotejo por ruta y hash de blobs de los PR de trabajo contra main y PR #26; compare de referencias históricas y dependencias. Un hash diferente no implica automáticamente defecto o ausencia de la funcionalidad: revisar diferencias antes de cerrar.

| PR / rama | Evidencia | Decisión recomendada |
|---|---|---|
| #10 finance-foundation | 5/6 archivos idénticos a main, pricing.ts diferente | Confirmar evolución del motor y cerrar como incorporado; no merge antiguo |
| #11 public-availability | 13/20 idénticos a main, 7 diferentes; todos presentes | Revisar evolución de disponibilidad y validación; cerrar si conserva alcance |
| #12 cinematic-ui | 4/5 idénticos a main, componente gallery actualizado | Cerrar tras verificar integración del componente |
| #13 premium-ui-skill | 4/4 archivos idénticos a main | Cerrar redundante |
| #14 private-delivery | Todos los archivos presentes en PR #26 o main; variantes ajustadas | Cerrar al validar e integrar #26; mantener deshabilitado hasta QA |
| #19 dot/cotizador-borrador | 5 archivos ausentes en main/#26; rutas de cotización/dashboard y menú divergentes | Rescatar exclusivamente mejoras útiles y tests de la simulación; no reemplazar cotización persistente. Cerrar tras resolver contenido único |
| #20 dot/finanzas-simulador | 5 archivos ausentes en main/#26; ruta financiera/configuración divergentes | Conservar lógica útil de escenarios como herramienta auxiliar si procede, sin duplicar libro financiero; cerrar tras resolución |
| #21 dot/portafolio-recorrido | 9/11 idénticos a main, tarjeta pública y shell actualizados | Revisar diferencias y cerrar; no degradar cambios más recientes |
| #22 dot/medicion-consentimiento | 11/11 idénticos a main | Cerrar redundante |
| #24 finance-operational | 10/12 idénticos a PR #26; otros 2 integrados con cambios | Cerrar después de validar e integrar #26 |
| #26 OS integrado | PR activo que Codex está revisando | Prioridad: QA, seguridad, respaldo y activación |
| #5 y #6 dependabot | Solo lockfile, ramas 27 commits detrás de main | Regenerar actualización sobre main y validar npm ci/audit; no fusionar a ciegas |
| #18 marca/WhatsApp | Cerrado por redundancia, incluido en release | No reabrir |
| #15, #16, #17, #23, #25 | Fusionados según metadatos de GitHub | Limpiar ramas de release después de confirmar que no hay trabajo nuevo |
| recovery/pre-production-2026-11-26 | 0 ahead, 27 behind | Conservar para recuperación |
| main | Release comercial | Proteger; integrar solo cambios validados |

No se cerró PR ni se eliminó rama durante esta revisión para evitar intervenir en el trabajo simultáneo. Se debe confirmar HEAD vigente antes de ejecutar limpieza. No borrar recovery ni ramas con trabajo único sin integrarlo o archivarlo.

## Validación real

- Copia local exacta de mobile-navigation.ts y tests/crisdal-mobile-navigation.test.ts verificada por git hash-object contra GitHub.
- TypeScript estricto, target ES2020, helper aislado: aprobado.
- Node 22 experimental strip types: 3/3 tests aprobados, adaptando solo la extensión del import en copia temporal.
- Lectura remota confirma el menú Más, medición de banner y fallback seguro de URL.
- Clone GitHub falló por DNS; no se ejecutaron lint, typecheck global, npm test completo, build Next.js, navegador real de la app ni Lighthouse. No afirmar aprobación visual.
- No se pudo consultar node_modules/next/dist/docs local por la misma limitación. Verificar APIs con documentación local al integrar.
- No se ejecutaron migraciones, despliegues ni modificaciones de datos reales.

## Handoff a Codex

1. Terminar integración activa, guardar cambios, actualizar referencias y revisar este PR UI contra el main vigente.
2. Incorporar cambios de UI sin sobrescribir el PanelShell, rutas y permisos nuevos del #26. Mantener un solo shell móvil y público; no rehacer toda la web.
3. Ejecutar skill crisdal-premium-ui, npm ci, npm run lint, npx tsc --noEmit --incremental false, npm test, npm run build.
4. QA real 320x568, 390x844, 768x1024, 1280x720 y 1440x900; probar zoom, viewport corto, teclado móvil, iOS safe areas, navegación con Tab/Escape, menú Más con todos los roles, WhatsApp con banner y sin banner, enlaces sociales, fotos portrait/landscape y galería. Verificar ausencia de overflow lateral y CLS notable.
5. Revisar rutas públicas /, /eventos, /portafolio, /portafolio/[slug], /paquetes, /consultar-fecha, /contacto, /contenido, /planes y /ruta-crisdal. Revisar panel completo con owner y roles limitados. Validar formularios, no activar entregas privadas prematuramente.
6. Tras QA, integrar rama UI y #26 en main de forma coordinada. Cerrar PR redundantes tras cotejo de contenido, conservar recuperación, limpiar ramas remotas ya integradas cuando no haya trabajo único. Si el #26 aún espera Supabase, el cambio de UI puede publicarse de forma independiente tras pruebas de regresión.
7. Priorizar activación de portafolio real, contacto y consultas de fecha para empezar a compartir la URL comercial. No bloquear publicación de mejoras seguras por funcionalidades administrativas futuras.
