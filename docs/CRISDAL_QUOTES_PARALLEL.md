# Crisdal OS — Motor de cotizaciones paralelo (fase 8, base de dominio)

**Rama:** `parallel/crisdal-finance-foundation`  
**Base original:** `b8b037a566e7de45bbfe407de970aad5f5afa02b`  
**Propósito:** preparar lógica independiente mientras Codex desarrolla eventos, UX/UI y agenda.

## Archivos añadidos

- `app/lib/os/quotes/pricing.ts` — motor de cotizaciones puro, determinista y sin E/S.
- `tests/os-quote-pricing.test.ts` — 14 pruebas unitarias con datos sintéticos.

## Semántica

- Importes en unidades menores enteras: `119000` = S/ 1,190.00.
- Tarifas y descuentos porcentuales en puntos básicos enteros: `1800` = 18%, `1000` = 10%, `10000` = 100%.
- Una tasa tributaria **solo se aplica si se declara explícitamente** en cada línea. No se presupone régimen tributario, afectación de IGV, exoneración, inclusión de impuestos en el precio ni legalidad fiscal de un documento.
- El precio unitario se entiende **antes de los tributos declarados**. Para precios con impuesto incluido se necesita un contrato explícito adicional; no se debe usar esta función suponiendo que `unitPriceMinor` ya incluye IGV.
- Flujo: precio unitario × cantidad → descuento de línea → descuento global prorrateado por peso de cada línea → tasa tributaria por línea → total.
- Los descuentos porcentuales y tributos se redondean al céntimo más cercano, con empates hacia arriba. El descuento general se distribuye por método del mayor residuo, desempate por orden de línea; las partes suman exactamente el total.
- El valor total se convierte a número JS solo si cabe en el rango seguro (`Number.MAX_SAFE_INTEGER`). Operaciones intermedias usan `bigint`.
- Rechaza cantidad cero/fraccionaria, importes negativos/fraccionarios, tasas >100%, IDs duplicados, demasiadas líneas y descuento global superior al neto.
- Soporta `PEN` y `USD` **por cotización**, sin conversión entre ellas.
- Cotización emitida debe conservar **snapshot inmutable** de descripciones, precios, tasas, condiciones, descuentos, números de documento y resultado. Un cambio del paquete público NO cambia una propuesta ya enviada.

## Ejemplo de evento

Cobertura HISTORIA: S/ 1,190 sin impuesto adicional declarado; `unitPriceMinor = 119000`, `quantity = 1`, `discountBps = 0`, `taxBps = 0`. El motor devuelve `totalMinor = 119000`. Esto **no implica** que los impuestos sean inaplicables: antes de facturar debe establecerse el tratamiento tributario real del negocio.

## Casos verificados

1. Paquete S/ 1,190 sin impuesto implícito.
2. Cantidades y descuento de línea.
3. Tributo explícito del 18%.
4. Prorrateo de descuento fijo en líneas de distintas tasas.
5. Descuentos secuenciales.
6. Descuento del 100%.
7. Redondeo por céntimo y reparto determinista.
8. Impuesto después de descuento general.
9. Descuento general superior a la base.
10. Importes, cantidades y tasas inválidas.
11. IDs duplicados y cotización vacía.
12. Overflow monetario.
13. Moneda USD sin conversión a PEN.
14. Pureza: no modifica objetos de entrada.

## Pendientes de integración con el repositorio principal

- No se creó interfaz, API, tabla, PDF, registro, mutación, integración Supabase ni envío por WhatsApp.
- Conciliar con las estructuras de `formularios-de-clientes/web/src/lib/adminData.ts` y las reglas de presupuesto y descuentos vigentes.
- La validación por negocio de límites de descuento, condiciones comerciales, cotizaciones aceptadas, vigencia, numeración y autorizaciones debe existir en la capa de dominio/servicio y en transacciones PostgreSQL.
- Una **cotización no representa dinero cobrado**: asociar cuentas por cobrar solo cuando corresponda una contratación válida.
- Para operaciones con cantidades fraccionarias (p. ej., horas a 1,5), se deberá diseñar una unidad mínima entera equivalente en lugar de introducir floats sin precisión definida.
- Si se requiere IGV con precio incluido, retenciones o percepciones, diseñar fórmulas por régimen tributario aplicable y pruebas específicas antes de utilizarlo en documentos fiscales.
- Introducir pruebas de invariantes en SQL y autorización `quotes.manage` antes de su uso con clientes.

## Validación local de esta entrega

- Node.js 22.16.0: **14/14** tests correctos usando type stripping con un import `.ts` explícito en copia temporal.
- TypeScript global, comprobación estricta del motor: **correcta**.
- La suite completa, ESLint y el build Next.js requieren dependencias del repositorio, no disponibles aquí; Codex deberá ejecutarlos al integrar.

## Integración sin conflictos

Tras finalizar la fase 4D/5A activa, Codex debe revisar el PR en borrador #10 contra `codex/crisdal-premium-os`, ejecutar `git fetch`, confirmar el HEAD real y aplicar solo las incorporaciones independientes (por PR o `cherry-pick`). No hacer merge a `main`, no desplegar y no ejecutar migraciones reales.