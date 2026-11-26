# Quality gates UX/UI — Crisdal

## Orden obligatorio

1. **Código:** `npm run lint`, `npx tsc --noEmit --incremental false`, `npm test`, `npm run build`. Registrar comando y salida real; no declarar ejecución si no se corrió.
2. **Visual:** inspeccionar screenshots móviles (390×844) y desktop (1440×900) con navegador, además de 320px y 768px; revisar overflow lateral y viewport corto con teclado virtual.
3. **Accesibilidad:** nav con teclado/Tab, foco visible, contraste AA, textos alternativos, `h1` único, labels, `aria-expanded`, `aria-live` para alertas, cerrar modales con ESC y devolver foco al disparador.
4. **Contenido:** imágenes reales y permisos, sin contenido comercial ficticio, CTAs correctos, estados de carga/vacío/error, enlaces externos seguros.
5. **Rendimiento:** inspeccionar Lighthouse/Web Vitals si hay herramientas; como metas, LCP <=2.5s, CLS <=0.1, INP <=200ms en p75 real; *no afirmar alcanzar objetivos sin medición*. Si no hay herramientas, inspeccionar tamaños y carga diferida.
6. **Regresión:** verificar `/`, `/eventos`, `/portafolio`, `/portafolio/[slug]`, `/paquetes`, `/contacto`, `/panel`, `/panel/portafolio`, `/panel/paquetes`, `/admin`, `/ruta-crisdal`. Solo rutas existentes al HEAD.
7. **Consentimiento:** imágenes privadas no públicamente accesibles; embeds sociales diferidos; Pixel/CAPI/UTMs solo con consentimiento correspondiente y sin duplicar eventos.
8. **QA admin:** una cuenta con permiso y otra sin permiso; API deniega acceso no autorizado; no mostrar success antes de guardar; mensajes recuperables ante falla.
9. **QA cliente:** entra desde móvil → ve evento → abre proyecto → amplía foto o video → compara paquete → consulta fecha → envía solicitud o WhatsApp contextual. Si un paso aún no existe, declarar como pendiente en vez de pintar un CTA falso.

## Rubrica de 100 puntos para revisión visual

- 25: fotografía protagonista, credibilidad, jerarquía de eventos.
- 20: recorrido de conversión y claridad de CTA.
- 15: diseño mobile y touch.
- 15: accesibilidad real y estados de interfaz.
- 10: estabilidad visual/performance.
- 10: consistencia de los tokens público/OS.
- 5: microinteracciones pulidas y discretas.

**No dar `aprobado` por score visual** si hay exposición de datos privados, fallos de autorización, componentes inoperantes o promociones engañosas.

## Entrega final a la persona responsable

```text
Pantalla(s): ...
Objetivo de usuario: ...
Cambios reales: ...
Archivos: ...
Pruebas ejecutadas y resultados: ...
Capturas revisadas (ancho): ...
Detalles de UX refinados: ...
Limitaciones y acciones pendientes: ...
Migraciones/despliegues realizados: ... (siempre declarar "ninguno" cuando aplique)
```

No instalar dependencias para obtener una puntuación superior. Priorizar diseño sobrio, fotografía fiel y experiencia predecible.
