# Crisdal OS — Integración operativa

Revisión del 26 de noviembre de 2026. La base comercial es `bb4bd9955f2121f7aa8c2fbba9a991ae91806856`. La rama `codex/crisdal-os-integration` conserva el trabajo de `parallel/crisdal-os-integrated` en `23ad34b2e85f2b0c1fcb20f4bd22c4c2dc28d8e0` ([PR #26](https://github.com/zam-ia/crisdal-agency/pull/26)). Incluye sus aportes de finanzas y entregas de los PR #24 y #14.

## Estado por módulo

| Módulo | Implementado en la rama | Validación pendiente |
| --- | --- | --- |
| CRM | Alta, edición, normalización de teléfono en servidor, control de duplicados, búsqueda global paginada por nombre, teléfono o correo, seguimiento e historial paginado de consultas vinculadas. | Ensayo con datos restaurados, selector de clientes e historial comercial más allá de consultas. |
| Cotizaciones | Cálculo con `pricing.ts`, tributo explícito, edición de borradores con historial de versiones y detección de edición simultánea. Al aceptar se crea una cuenta por cobrar y un proyecto único. El monto vinculado queda protegido de correcciones manuales. | Selección de paquetes, PDF y enlace compartible, archivo de evidencia, cronograma, modificaciones y cancelaciones contractuales. |
| Finanzas | Alta de contratos anteriores, cobros, devoluciones, gastos, registro interno de boletas externas y punto de equilibrio. Se verificó que el alta no exige un contrato previo. | Búsqueda de comprobantes, PDF/XML privado, vencimientos, conciliación, costos comprometidos y exportación. |
| Producción | Etapas, responsable, fecha límite, tareas, notas y asociación opcional de entregas. | Personal y recursos por evento, horarios, entregables, costos y conflictos contra agenda. |
| Indicadores | Cobros, gastos, saldos, boletas, tendencias, propuestas aceptadas y proyectos abiertos o vencidos. Selector PEN/USD. | Rentabilidad por servicio/evento, cartera vencida, metas, proyecciones, comparaciones y exportación. |
| Entregas privadas | Módulo incorporado con activación explícita, enlace con hash, firma de medios y visor con diálogo nativo y navegación por teclado. | Activación bloqueada hasta ensayar Storage real, expiración y revocación, límites de acceso, carga concurrente, limpieza de huérfanos y aislamiento de campañas de tracking. Las firmas ya emitidas tienen vigencia residual. |

La aceptación se probó sin contabilizar dinero, sin modificar la disponibilidad y sin crear una reserva. El registro de una boleta tampoco afecta la caja.

## Base de datos y respaldo

Se confirmó OAuth para el MCP de Codex con el proyecto `emdheaugznkzskrgkyaw`, incluidos `feedback` y `notebooks`. La inspección en solo lectura confirmó PostgreSQL 17.6, 11 tablas públicas heredadas, una cuenta Auth, cero migraciones registradas y 21 objetos de Storage en siete buckets, incluido uno en un bucket privado. Se cotejaron las columnas, las restricciones, los índices, RLS y el bucket del CMS heredado.

El servidor PostgreSQL 17.12 aislado corrió en loopback. Auth y Storage se representaron con tablas mínimas y fixtures sintéticos. El candidato tenía un delimitador SQL inválido, corregido antes de ejecutar las pruebas. La CLI generó la migración que ahora se versiona como `20261126200100_crisdal_operational_modules.sql`, después de `20261126200000_crisdal_operational_finance.sql`. Se ensayó la secuencia completa en una base limpia, incluido el archivo de integración con rollback `docs/sql/CRISDAL_OPERATIONS_ISOLATED_QA.sql`.

El OAuth de MCP habilita las herramientas de administración, que en esta sesión no exponen un export recuperable de PostgreSQL ni una copia de los blobs privados. El ensayo aislado con fixtures no sustituye restaurar la base real. Quedan pendientes el acceso directo al proyecto para el dump, la copia separada de Storage y la restauración de ambos con sus permisos. El historial remoto sigue intacto. No hay migraciones de esta entrega aplicadas en producción, alta de propietario ni publicación de un proyecto real.

## QA ejecutado

- `npm ci`, lint, TypeScript, `npm test` (114 pruebas) y compilación de Next.js.
- Reejecución de las 11 migraciones en PostgreSQL 17.12. La prueba con `service_role` comprobó revisiones, rechazo de versiones obsoletas, aceptación idempotente, cuenta y proyecto únicos, importe protegido y registro de tareas.
- Sesiones PostgreSQL independientes comprobaron aceptaciones simultáneas, cobros simultáneos de importe superior al saldo combinado, rechazo de otra moneda, unicidad de boleta y separación entre boleta y caja. Los roles `anon` y `authenticated` quedaron sin acceso directo a las tablas y RPC comprobadas. El rol de producción no pudo aceptar cotizaciones ni crear cuentas financieras.
- En navegador local se usó una sesión nominal sintética y un servicio HTTP de prueba. Se comprobó inicio y cierre de sesión, búsqueda, historial, formulario de cotización, alta manual financiera y menú móvil. Clientes, Cotizaciones, Producción, Finanzas e Indicadores se revisaron a 320, 390, 768, 1280 y 1440 px sin desbordamiento. Se capturaron pantallas de directorio, menú móvil, cotización e indicadores durante el QA.
- El release comercial de `main` respondió HTTP 200. La revisión de integración se envía a Preview, con entregas privadas deshabilitadas. La aceptación de la revisión y su despliegue productivo quedan condicionados a los ensayos sobre la restauración real y a los controles pendientes del módulo que se quiera activar.
