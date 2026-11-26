# Crisdal — pulido del recorrido público

Base: PR #28, commit 2f82221a833bad81e71b55e095a008c6cf30e6f4. Rama temporal separada del trabajo concurrente. Se revisó la captura aportada: "Cobertura" invadía el nombre por una columna fija de 3rem.

## Cambios
- Componente CoverageSection compartido por inicio, eventos y fallback de paquetes: etiquetas en una fila independiente, nombre y descripción en bloques, 3 tarjetas alineadas en escritorio y una por fila en móvil. CTA contextual y enlace al catálogo/consulta de fecha. Sin precios ni entregables inventados.
- PortfolioPreview recibe exclusivamente proyectos del portafolio público de eventos; muestra hasta tres trabajos reales y sus portadas o un texto de publicación social. Sin iframes en inicio. Estado vacío compacto con solicitud de referencias y enlace al archivo. No se publicó ninguna foto de las capturas.
- Portafolio: conserva encuadre de fotos y posters; reconoce formatos explícitos photo/carousel/reel/video de publicaciones sociales en filtros; distingue publicaciones sin portada.
- Barra de navegación: elimina degradado exterior, conserva superficie glass y reduce sombra; textos con mayor contraste. Jerarquía de secciones, proceso, FAQ, CTA final marfil, contacto y footer con espaciado y contraste más consistente.
- Catálogo: tarjetas alineadas, filtros flexibles, selección se limpia al cambiar línea y WhatsApp usa número central y componente con consentimiento. Se evita barra sticky que compita con WhatsApp flotante.
- Se conserva eventos primero y negocios al final, rutas, precios, lógica de consentimiento, backend y datos.

## Validación efectivamente realizada
Chromium con Playwright en fixture HTML que reproduce el markup y textos de CoverageSection y usa el CSS exacto (git hash-object c6a22fc2ad3d26889566f88ab7cea85832b6bef7, cotejado contra GitHub). Anchos 320/390/768/1280/1440: sin overflow horizontal, gap etiqueta-título de 12px móvil y 16px tablet/escritorio, todos los CTA >=44px, transición 0s con movimiento reducido. Capturas aisladas 390 y 1440 inspeccionadas.
Se añadieron 3 tests estructurales de regresión en tests/public-ui-layout.test.ts. Lectura remota de componentes confirma integración. No se ejecutó suite Next completa ni navegación de la app real ni se midieron Web Vitals. No se consultó documentación local de Next por no tener checkout/node_modules; no se introducen APIs nuevas de Next.
## Relevo
Comparar con HEAD actual de codex/crisdal-os-integration (durante la revisión avanzó a 0c593f8f; sus seis archivos cambiados no se superponen con esta entrega). Integrar este PR dirigido a esa rama, repetir npm ci, lint, tsc, npm test, build y QA responsive real. Verificar /, /eventos, /portafolio y detalle con imágenes autorizadas y sin portada, /paquetes con/sin datos, /contacto, /consultar-fecha y tracking/WhatsApp. Comprobar que todas las rutas conservan un solo h1 y accesibilidad. No activar Supabase ni galerías privadas por este cambio. Mantener main intacto hasta las comprobaciones del release, cerrar la rama temporal tras incorporar.
