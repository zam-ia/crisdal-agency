# Crisdal OS — Fundamentos financieros para integración paralela (Fase 7)

**Rama:** `parallel/crisdal-finance-foundation`  
**Base:** `b8b037a566e7de45bbfe407de970aad5f5afa02b`  
**Propósito:** trabajo independiente de la fase 4D/5A en curso con Codex. **No es un módulo financiero listo para producción.**

## Entregado

- `app/lib/os/finance/ledger.ts`: funciones puras para calcular saldos de cuentas por cobrar, pagos parciales, devoluciones, anulaciones y flujo de caja mensual en la zona horaria de Lima.
- `tests/os-finance-ledger.test.ts`: nueve pruebas con casos representativos, sin base de datos ni datos personales.
- Este documento de contratos y hoja de integración.

## Contrato de dinero

- `119000` representa **S/ 1,190.00**, no S/ 119,000.
- Solo enteros seguros, siempre en unidades monetarias menores; no floats ni redondeos implícitos.
- `PEN` y `USD` son monedas distintas: jamás sumarlas ni convertirlas sin un tipo de cambio explícito y documentado.
- Una **cotización** no se cuenta como cobro. Una cuenta por cobrar de S/ 1,190 y un anticipo de S/ 300 produce saldo de S/ 890.
- Pagos y devoluciones tienen identificador único, estado `posted/voided` y nunca se borran para ajustar cifras.
- Se rechaza exceso de cobro, devolución superior al cobro neto, importe inválido, duplicidad y movimientos de otra cuenta.
- El flujo de caja del mes registra `receipt`, `refund`, `expense`; no equivale a utilidad tributaria ni a rentabilidad contable.
- El mes corresponde a `America/Lima`, aunque la base almacene instantes en UTC.

## Trabajo pendiente de Codex, antes de activar finanzas

1. Integrar tras finalizar 4D/5A usando `git fetch` y `git cherry-pick`, sin fusionar `main` ni reemplazar sus cambios.
2. Revisar si los contratos de dinero corresponden al nuevo modelo SQL; adaptar sin romper invariantes.
3. Diseñar migraciones PostgreSQL separadas para `receivables`, `payments`, `expenses`, `payment_accounts` y eventos de anulación; incorporar FK reales a clientes/proyectos **cuando las tablas operativas existan**.
4. Todas las escrituras de cobros, devoluciones, anulaciones y saldos deben ser **atómicas y transaccionales**. Las validaciones puras no sustituyen restricciones, locks y/o funciones SQL para prevenir carreras entre usuarios.
5. Auditar cambios y permisos `finance.read`/`finance.write` en el DAL; proteger los DTO ante usuarios sin privilegios.
6. Validar disponibilidad, respaldos y rollback antes de cualquier migración sobre producción.
7. Reconciliar posteriormente el snapshot administrativo legado con la base nueva; nunca interpretarlo como fuente de verdad sin validación.
8. Elaborar UX de cobros parciales, saldos y gastos con estados vacíos y error, sin métricas de demostración presentadas como reales.

## Pruebas locales

- Node.js 22.16.0: nueve pruebas superadas utilizando type stripping en una copia temporal del test con import TS explícito.
- TypeScript 5.8.3 global: comprobación estricta de tipos de ambos archivos superada.
- No se ha ejecutado el build ni el lint del repositorio completo porque no está disponible en el contenedor local. Codex debe ejecutar `npm test`, `npm run lint`, `npx tsc --noEmit --incremental false` y `npm run build` cuando integre los cambios.

## Límites deliberados

- No se crearon ni ejecutaron migraciones.
- No se modificaron rutas, UX del dashboard ni código bajo `app/ui/os/`.
- No se leyeron ni escribieron movimientos financieros reales.
- No se habilitó administración financiera ni se tocó producción.
