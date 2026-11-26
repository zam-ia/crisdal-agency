# Crisdal OS — Control financiero operativo y registro interno de boletas

Rama: `parallel/crisdal-finance-operational`. Base: `ee5b044c2f7f7ef3cd2f2d1f67c7d6de01c3389a`. Entrega paralela independiente del release comercial/CRM que Codex está ejecutando. No fusionar a ciegas.

## Alcance entregado

- /panel/finanzas: acceso autorizado, interfaz responsive, cuatro pestañas (Resumen, Contratos y saldos, Cobros y gastos, Boletas SUNAT).
- /api/panel/finance: lectura/escritura con finance.read/finance.write, validación Zod, no-store y control de origen en mutaciones.
- SQL aditivo 20261126200000_crisdal_operational_finance.sql: cuatro tablas privadas, RLS, RPCs transaccionales, locks por cuenta, auditoría, idempotencia por huella de solicitud, unicidad de comprobante por RUC/serie/correlativo.
- Altas de contratos, corrección justificada de monto, cobros, devoluciones, gastos, anulación de registro, boletas, corrección interna y registro de baja ya realizada externamente. Nunca se llama a SUNAT ni se emite comprobante.
- Datos en céntimos; PEN/USD separados. Estados reales o error de activación; no hay datos de demo en el panel.
- Resumen mensual y gráfico de seis meses con agregación en SQL (no depende de los 50 registros visibles). Paginación de listados.
- Contribución estimada por contrato: importe contratado menos costos directos pagados; no es utilidad final. Punto de equilibrio estimado: ceil(gastos fijos / (precio promedio - costo variable)). No se calcula si el margen es <=0.
- Reutiliza las reglas del módulo ledger.ts ya incorporado; no reescribe el motor de cotizaciones.

## Principios de negocio

Un contrato de S/1190 con anticipo S/300 y gasto directo S/100 tiene S/890 por cobrar y S/200 de flujo neto asociado a estos movimientos. Registrar una boleta de S/300 no suma un segundo ingreso. El flujo mensual no representa saldo bancario ni utilidad contable; los comprobantes no sustituyen contabilidad tributaria. IGV se transcribe si figura; no se infiere tasa ni régimen. El usuario emite y consulta sus comprobantes exclusivamente en SUNAT.

Se revisó la página 1 del resumen comercial de una boleta aportado por el propietario. Es un documento de acompañamiento, no el comprobante original ni evidencia de cobro. Se añadieron origen del documento (original SUNAT, resumen comercial o referencia manual), descuento consignado y detalle opcional de hasta 20 líneas con cantidad entera, descripción, valor unitario e importe copiados literalmente. No se infiere régimen, IGV, suma tributaria ni importe en letras; el importe total se transcribe. La cantidad entera responde a los servicios del ejemplo; ampliar si aparecen cantidades fraccionarias. La diferencia entre sumas de líneas y total no se corrige automáticamente por posibles bases o redondeos distintos; revisar contra el original. No introducir DNI, RUC, nombres, PDFs ni boletas reales en Git ni datos de prueba. Para adjuntos PDF/XML futuros usar bucket privado, autorización, límite de tamaño, URL firmada y política de retención; no publicar documentos.

## Integración con Codex

1. Terminar release comercial y CRM de Codex, guardar cambios, hacer fetch. Comparar la rama financiera contra HEAD vigente de main. Si Codex ha creado tablas/rutas financieras o contratos CRM, conciliar el diseño ANTES de aplicar SQL. No mantener dos libros ni duplicar clientes. Las cuentas por cobrar actuales guardan título y cliente como snapshot manual con referencia opcional; vincularlas al ID canónico de cliente/contrato/proyecto del CRM mediante FK y unicidad apropiadas, con backfill controlado, antes de habilitar creación automática. No inferir contratos desde consultas ni cotizaciones no aceptadas.
2. Resolver el pequeño cambio de navegación en panel-shell.tsx respetando menú actual. Invocar $crisdal-premium-ui y revisar responsive.
3. Confirmar versiones/colisiones de migraciones; no cambiar una migración ya aplicada. La migración depende de identidad y capacidades finance.read/finance.write (comprobar roles owner/finance).
4. Ensayar en Postgres/Supabase aislado con el esquema real. Revisar concurrencia, idempotencia, restricciones, FK, RLS, derechos de RPC y auditoría. El servicio role es exclusivo de servidor. No otorgar permisos a anon/authenticated. Probar doble clic y reintentos, dos cobros concurrentes, devoluciones, anulaciones y correcciones de contratos. Las consultas públicas nunca pueden acceder a finanzas.
5. Antes de activar: respaldo y restauración verificados; revisar el historial real de migraciones y seguir el protocolo vigente de producción.
6. Ejecutar npm ci, npm run lint, npx tsc --noEmit --incremental false, npm test, npm run build; probar 320/390/768/1280/1440 px y sesiones owner, finance, production y comercial. No activar si falla.
7. Revisar privacidad y auditoría de datos; las bajas/correcciones internas no modifican SUNAT, ni constituyen una validación externa. Preparar adjunto privado PDF/XML solo tras confirmar la necesidad y formato real.

## QA pendiente específico

- Las pruebas de dominio y estáticas SQL están versionadas. No equivalen a un ensayo de SQL ni build/QA completo. Verificar SQL contra PostgreSQL real, no solo texto.
- Selección de cuentas y pagos actualmente limitada a páginas consultadas: añadir búsqueda remota de contrato/cliente/pago y selección accesible para grandes volúmenes. Un pago asociado a una boleta no implica que el total de ambos coincida (pueden existir varios comprobantes o anticipos); definir conciliación fiscal antes de automatizarla.
- Si un movimiento vinculado a boleta se anula, mostrar alerta de reconciliación; no anular la boleta automáticamente.
- Revisar retención de auditoría, búsqueda de comprobantes por serie/número, exportación CSV segura (evitar fórmulas), fecha de vencimiento de saldo, cuentas bancarias/caja y conciliación. Las notas de crédito/débito y facturas son ampliaciones posteriores; no emitirlas desde la plataforma.
- Añadir costos comprometidos/estimados, impuestos y gastos generales asignados para rentabilidad económica real. No etiquetar la contribución estimada como beneficio neto. El punto de equilibrio utiliza entradas manuales y es una planificación, no un pronóstico automático.
- Evitar falsa confirmación si falla la respuesta después de guardar: reusar ID en reintentos y revisar registro antes de repetir si se cerró formulario.
- No se ha desplegado ni aplicado la migración en producción.

## Revisión posterior al PR

Se corrigió una corrupción detectada en la migración (duplicación del final y restricción de hash truncada). Se verificaron por lectura remota un solo COMMIT, una definición de cada RPC y la columna result_id. Se añadieron pruebas de regresión para evitar este problema. No se ejecutó SQL ni la suite de Next.js. No integrar la migración si ya fue aplicada con una versión distinta; comprobar el historial real. El origen de los comprobantes no equivale a validación SUNAT. No incluir datos del comprobante real, DNI, RUC ni su PDF en Git. 
