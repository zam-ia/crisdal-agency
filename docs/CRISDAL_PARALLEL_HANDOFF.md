# Relevo paralelo — Crisdal OS después del release comercial

Fecha de corte: 2026-11-26. main verificado: 531764dfe76d351fb5d48f1356fba8665b28a69c.
Fuentes: árbol de main, PR #23 fusionado, docs/CRISDAL_OPERATIONAL_ACTIVATION.md, PR #14 y PR #24. El estado de la rama activa de Codex puede ser posterior; verificar su informe y HEAD antes de integrar.

## Entrega lista para revisar

PR #24: https://github.com/zam-ia/crisdal-agency/pull/24
Rama: parallel/crisdal-finance-operational.
Incluye panel, API, SQL y tests para contratos/saldos, dinero recibido/devuelto, gastos, boletas externas, contribución y punto de equilibrio. Adaptado a un resumen comercial de boleta aportado por el propietario: origen, descuento, conceptos, cantidad, valor unitario e importe. No emite documentos SUNAT ni registra automáticamente un pago. Se corrigió un defecto de la migración y se añadió cobertura estática para prevenirlo. No contiene datos del cliente real ni el PDF.

PR #14: https://github.com/zam-ia/crisdal-agency/pull/14
Entregas privadas aún en borrador, requiere actualización sobre main y QA de privacidad. No confundir con el portafolio social ya publicado.

PR #23: fusionado; #18 sustituido. No reimportar #10–13 ni #18 ni #23.

## Orden operativo propuesto

| Etapa | Dependencia | Criterio de salida |
|---|---|---|
| 0. Activación segura | Backup recuperable y restauración aislada | Ocho migraciones conciliadas, owner real, login y RLS probados; no contratar ramas de pago sin permiso |
| 1. Portafolio real | Identidad y Storage | Publicar/despublicar trabajo autorizado, reproducción social con consentimiento y fallback |
| 2. CRM | Activación de consultas y agenda | Un cliente canónico, seguimiento, consulta y reserva confirmada claramente distintas |
| 3. Cotizaciones/contratos | CRM + paquetes + pricing.ts existente | Snapshot de condiciones y precio aceptado, fechas de pago, sin duplicar contrato |
| 4. Finanzas | Contrato canónico + PR #24 | Cobro parcial, saldo, gasto y boleta reconciliados sin duplicar caja; pruebas transaccionales |
| 5. Producción y entregas | Proyecto confirmado + PR #14 | Responsables, entregables, fechas y galería privada protegida y revocable |
| 6. Informes y operación | Datos persistidos y reconciliados | Costos comprometidos vs pagados, contribución vs beneficio neto, cartera vencida, meta comercial; reportes exportables privados |

Las etapas 2–5 pueden prepararse en código sin Supabase remoto, pero no declararse operativas. Codex está desarrollando CRM y activación: no crear un segundo CRM ni un segundo ledger.

## Contratos de integración

- Cliente: identidad canónica CRM; snapshots comerciales/financieros separados para preservar historial. Nunca buscar/conciliar automáticamente por nombre solo. Normalizar teléfono y controlar duplicados con confirmación.
- Solicitud: intención, no reserva ni ingreso. Reservar disponibilidad solo después de confirmación y asignación operativa de recursos.
- Cotización: propuesta versionada con líneas y condiciones congeladas al aceptar; reutilizar pricing.ts. No autocalcular tributos sin criterio del negocio.
- Contrato: único ID aceptado, moneda, valor y vencimientos; creación idempotente de cuenta por cobrar ligada al contrato. Las cuentas manuales del PR #24 necesitan reconciliación con el CRM antes de activar creación automática.
- Movimiento: cobro, devolución o gasto efectivo, moneda y fecha, con referencia, transacción e historial; no convertir boleta o cotización en ingreso.
- Boleta: registro interno de referencia ya emitida; original SUNAT, resumen comercial o manual; RUC/serie/correlativo únicos; relación opcional con contrato y cobro. PDF/XML de respaldo pendiente; guardar solo en bucket privado con permisos, retención y auditoría, nunca Git. No inferir pago por importe documentado ni IGV cero por el ejemplo.
- Proyecto: reserva confirmada → planificación → cobertura → edición → revisión → entrega. Relacionar contrato/cliente; permitir costos directos, fechas y responsables.
- Galería privada: proyecto asociado, enlaces de acceso revocables, permiso y vencimiento; sin tracking publicitario, con límites de acceso y costos de Storage.
- Informes: distinguir facturación documentada, contratado, flujo de caja, saldo por cobrar, contribución y utilidad. Reportar cada moneda por separado. El punto de equilibrio es una estimación, no un cálculo tributario.

## QA de relevo

1. Guardar cambios de Codex, comprobar HEAD de main y rama actual; git fetch.
2. Leer PR #24 y #14, revisar diferencias y adaptar cambios sobre los contratos canónicos; no fusionar a ciegas.
3. Verificar que la migración financiera nunca se aplicó antes de incorporar su versión corregida. Si existe una versión aplicada, resolver mediante migración aditiva y reconciliación.
4. Reutilizar la skill $crisdal-premium-ui. Finanzas debe mostrar cuatro secciones claras y acciones rápidas; detalle de boleta opcional.
5. En ambiente aislado: pruebas SQL, dos cobros concurrentes, reintentos, moneda, devolución, boleta repetida y correcciones, rechazo anon/authenticated, permisos owner/finance vs roles no autorizados. Datos sintéticos solamente.
6. Ejecutar lint, typecheck, test y build. Revisar responsive 320/390/768/1280/1440 y flujo real. Confirmar que los botones y errores sean entendibles.
7. No aplicar migraciones remotas ni publicar módulos pendientes sin respaldo/restore y gates de seguridad. Seguir docs/CRISDAL_OPERATIONAL_ACTIVATION.md.
8. Entregar informe con SHA, estado de cada módulo y pruebas ejecutadas realmente. Si continúa bloqueado Supabase, identificar el bloqueo y separar código preparado de funcionalidad activada.

## Bloqueos y decisiones

- No se ejecutó el build completo, el SQL real ni QA de navegador de PR #24 en esta rama. Las pruebas nuevas están escritas; el chequeo estructural remoto no sustituye su ejecución.
- No se cargó la boleta real ni datos personales en producción ni en Git. Adjuntos privados, facturas/notas de crédito, conciliación bancaria y beneficio económico completo quedan pendientes.
- No se tocó main ni la rama activa de Codex. No afirmar que Codex terminó su tarea hasta leer su reporte.
