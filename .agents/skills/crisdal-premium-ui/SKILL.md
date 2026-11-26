---
name: crisdal-premium-ui
description: "Diseñar, implementar y auditar UX/UI premium de Crisdal Agency (Next.js/React): web audiovisual enfocada en bodas, quinceaños y eventos, portafolio, calendarios, formularios, galería de fotos/videos y panel Crisdal OS. Usar al crear o refinar páginas, componentes, animaciones, estilos responsive y flujos comerciales, o al revisar capturas, contraste, accesibilidad y rendimiento."
---

# Crisdal Premium UI — workflow

Esta skill es una **guía de ejecución para código**, no un prompt para generar mockups. Aplicar en la web pública y el panel del repositorio `zam-ia/crisdal-agency`. Prioridad comercial: **eventos primero, contenido para negocios al final**.

## Antes de escribir código (máximo 5 minutos de reconocimiento)

1. Confirmar branch, HEAD, cambios locales y `AGENTS.md`; nunca sobrescribir trabajo concurrente.
2. Leer solo rutas/componentes afectados y tokens existentes. Public: `app/ui/marketing/marketing.module.css`; OS: `app/ui/os/os-tokens.css`; revisar implementaciones actuales antes de refactorizar.
3. Identificar audiencia, acción principal, fuente de datos y estados: loading / empty / error / success / no autorizado.
4. Para detalles de identidad leer [references/brand-and-layout.md](references/brand-and-layout.md). Para componentes/interacciones leer [references/patterns.md](references/patterns.md). Para cierre usar [references/quality-gates.md](references/quality-gates.md).
5. Antes de nuevas APIs Next.js consultar la documentación **local de Next** exigida por `AGENTS.md`. No instalar paquetes por moda; reutilizar CSS Modules, componentes y librerías existentes.

## Jerarquía y diseño

- **Público:** fotografía y video de bodas, quinceaños, corporativos, celebraciones, bautizos, pedidas de mano, sesiones; después contenido empresarial. Convertir en `ver trabajo → entender cobertura → consultar fecha/solicitar propuesta`.
- **Admin:** tareas frecuentes en máximo 2–3 decisiones: crear trabajo, subir fotos, elegir portada, revisar autorización, publicar, compartir. Bajar la carga cognitiva, no esconder funciones.
- Diferenciar superficies: **marketing editorial oscuro** vs **Crisdal OS luminoso/turquesa**. No introducir un tercer lenguaje visual.
- Cada pantalla: un `h1`, una acción primaria dominante, agrupación semántica, tipografía clara y espacios deliberados. Fotos auténticas autorizadas como protagonistas.
- Nunca inventar trabajos, descuentos, fechas libres, opiniones, reservas, precios ni entregables. No mostrar datos privados de eventos a terceros.
- No reemplazar rutas/funciones existentes sin prueba de compatibilidad de `/admin`, `/ruta-crisdal`, Pixel/CAPI, UTMs, consentimiento y WhatsApp.

## Flujo de implementación

1. **Auditar** la pantalla existente: captura a 390, 768, 1280/1440 px cuando haya navegador; identificar 3 problemas medibles y 3 decisiones de diseño. No asumir que la UI se ve bien porque compiló.
2. **Definir un contrato de interacción**: recorrido, estados, controles, teclado, errores, enlaces, carga de contenido, confirmaciones y consentimiento.
3. **Diseñar con tokens existentes**; nuevos tokens solo si son reutilizables. CSS Modules; componentes pequeños, semánticos; Server Components por defecto y `"use client"` solo donde haga falta.
4. **Implementar en rebanadas verticales**: componente → estado vacío/error → funcionalidad → responsive → accesibilidad → test. Cada control visible debe hacer algo real.
5. **Pulir microinteracción**: movimientos en `transform`/`opacity`, duraciones breves, sin bloquear entrada, sin animaciones continuas innecesarias; `prefers-reduced-motion`.
6. **Comprobar** con [references/quality-gates.md](references/quality-gates.md). Comparar capturas antes/después, resolver fallos, listar límites reales.

## Criterios para efectos "liquid glass"

Aplicar **selectivamente**, sobre navegación, selector, visor de imágenes o pequeñas capas flotantes. Nunca a todos los contenedores, nunca sobre texto denso, nunca a costa de leer fotografías. Preferir CSS `backdrop-filter` + fondo semitransparente + borde tenue; alternativa sólida con `@supports`. Evitar shaders/WebGL/canvas grandes, librerías de efectos o `mousemove` global si no hay justificación y medición.

## Reglas no negociables

- Mobile-first funcional: acciones táctiles de aproximadamente 44×44 CSS px o más, hit areas generosas, no overflow horizontal.
- Contrast AA, `:focus-visible`, `aria-label` donde haga falta, navegación teclado, ESC y restauración de foco en modales, `prefers-reduced-motion`.
- Imágenes proporcionadas con dimensiones o aspect-ratio; usar `next/image` cuando el origen/config lo permita, srcset/sizes apropiado; no cargar iframes sociales hasta interacción/consentimiento.
- Fecha pública solo con estado comprobable; desconocido = **Consultar**, no `Disponible` inventado.
- En formularios: validación inline, errores accionables, carga, confirmación solo tras persistir, controles anti-spam donde proceda.
- Consentimiento de publicación verificable: borradores/medios privados no públicos; anonimizar nombre/lugar de evento si no autorizado.
- No instalar UI kits enteros ni reemplazar rutas existentes sin revisar coste y compatibilidad.
- El trabajo final debe incluir: archivos cambiados, flujo probado, capturas si disponibles, resultados de `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, y limitaciones de producción. No afirmar pruebas que no se ejecutaron.

## Uso rápido recomendado

Invocar explícitamente `$crisdal-premium-ui` al pedir una pantalla o auditoría visual. Si hay conflicto con un requerimiento comercial específico aprobado, respetar dicho requerimiento y explicar el cambio de diseño. No hacer merge, migraciones remotas ni deploy de producción sin autorización.
