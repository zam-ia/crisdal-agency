# Cotizador en borrador · trabajo paralelo
Ruta: `/panel/cotizaciones`. Reutiliza `priceQuote` y el permiso existente `quotes.manage`. Hay acceso por menú de escritorio y desde las acciones rápidas de Inicio en móvil. Los importes viven solo en memoria del componente. No hay persistencia, clientes reales, precios predeterminados, impuestos automáticos, emisión, PDF ni envío.

## Para comparar al integrar
- Mantener el guard de servidor incluso si otra rama reordena la navegación.
- Revisar la ruta en 320, 390, 768, 1280 y 1440 px; verificar foco, lectura de errores, sumar y quitar conceptos, y separadores decimales coma/punto.
- Con una cuenta autorizada en staging: 2 × 99,90 PEN con 10% por concepto y 5% general debe dar S/ 170,83 sin impuestos. Descuento fijo superior al importe bloquea el total. Cambiar a USD no convierte los valores. Recargar borra el borrador.
- Sin sesión debe ir a login y con sesión sin permiso a Inicio; no conectar al sitio público, facturación ni enviar propuestas antes de definir el flujo definitivo de aprobación y persistencia.
- No requiere migraciones. No fusionar ni desplegar como parte de este borrador. Revisar con el HEAD de Codex y ejecutar lint, typecheck, suite, build y QA autenticado antes del merge.
