# Quality gates UX/UI — Crisdal

## Orden obligatorio

1. **Código:** `npm run lint`, `npx tsc --noEmit --incremental false`, `npm test`, `npm run build`. Registrar comando y salida real; no declarar ejecución si no se corrió.
2. **Visual:** inspeccionar screenshots móviles (390×844) y desktop (1440×900) con navegador, además de 320, 375, 430, 768, 1024, 1280 y 1920 px; revisar overflow lateral y viewport corto con teclado virtual.
3. **Accesibilidad.** Verificar texto normal a 4.5:1 y texto grande a 3:1 en claro y oscuro. Revisar tabs activos e inactivos, botones habilitados y deshabilitados, ayudas, etiquetas y placeholders. Probar Tab, foco visible, nombres accesibles, Escape y retorno de foco.
4. **Contenido:** imágenes reales y permisos, sin contenido comercial ficticio, CTAs correctos, estados de carga/vacío/error, enlaces externos seguros.
5. **Rendimiento:** inspeccionar Lighthouse/Web Vitals si hay herramientas; como metas, LCP <=2.5s, CLS <=0.1, INP <=200ms en p75 real; *no afirmar alcanzar objetivos sin medición*. Si no hay herramientas, inspeccionar tamaños y carga diferida.
6. **Regresión:** verificar `/`, `/eventos`, `/portafolio`, `/portafolio/[slug]`, `/paquetes`, `/contacto`, `/panel`, `/panel/portafolio`, `/panel/paquetes`, `/admin`, `/ruta-crisdal`. Solo rutas existentes al HEAD.
7. **Consentimiento:** imágenes privadas no públicamente accesibles; embeds sociales diferidos; Pixel/CAPI/UTMs solo con consentimiento correspondiente y sin duplicar eventos.
8. **QA admin:** una cuenta con permiso y otra sin permiso; API deniega acceso no autorizado; no mostrar success antes de guardar; mensajes recuperables ante falla.
9. **QA cliente:** entra desde móvil → ve evento → abre proyecto → amplía foto o video → compara paquete → consulta fecha → envía solicitud o WhatsApp contextual. Si un paso aún no existe, declarar como pendiente en vez de pintar un CTA falso.

## Panel administrativo

- Comprobar zoom real al 100 %, 125 % y 150 % con una ventana de escritorio de altura reducida. Verificar que el sidebar tenga scroll propio, barra perceptible y el último enlace alcanzable por ratón y teclado. La preferencia de contraer debe restaurarse al recargar.
- Confirmar que el botón Crear funcione expandido, contraído y en móvil. Los tooltips deben aparecer con foco y puntero. El dock y las cabeceras fijas deben dejar accesibles los botones y campos del contenido.
- Verificar que los formularios mantengan proporciones al estrecharse, incluidos filtros, campos de fecha y grupos de acciones. Los controles habilitados deben conservar contraste y aspecto interactivo.

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
