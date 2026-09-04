# Impulso Local · Crisdal Agency

Landing de campaña en Next.js 16, React 19 y TypeScript. Una sola oferta: S/380, pago único por el servicio. La inversión en Meta Ads se paga aparte. Todos los CTA abren el WhatsApp +51 992 566 725.

## Desarrollo

```sh
npm ci
npm run dev
npm run lint
npm run build
npm run start
```

## Contenido y decisiones

- Negro, dorado y tipografía condensada para mantener continuidad con el anuncio suministrado.
- Hero con precio y CTA; botón fijo en móvil; entregables con beneficios; condiciones visibles; cinco preguntas frecuentes.
- Sin menú de navegación, formularios redundantes, escasez inventada, testimonios ficticios ni promesas de ventas garantizadas.
- La duración de campaña y del acompañamiento no fue proporcionada. Se confirma con el cliente antes del pago; no se promete una duración inventada.
- Fotografía de la asesora adaptada del anuncio mediante edición asistida por IA. El anuncio original se conserva como muestra identificada del trabajo de la propia agencia, no como testimonio.
- Imágenes WebP, tamaños responsivos, fuente local con licencia OFL y movimiento reducido para usuarios que lo prefieren.
- /gracias orienta a enviar el mensaje; no afirma que una consulta haya sido recibida. Abre WhatsApp en otra pestaña y conserva esta pantalla de ayuda en la pestaña de origen.

## Meta Pixel

ID público: `3971063776548749`, configurado en `app/lib/config.ts`.

- `PageView`: carga inicial y cambios de ruta.
- `ViewContent`: visita a la oferta en `/`, con nombre y categoría del servicio; también al volver a ella mediante navegación interna. No se dispara en `/gracias` ni en páginas inexistentes, ni se duplica durante la hidratación.
- `Lead`: primer clic en cualquier CTA de WhatsApp de la sesión. Es una intención de contacto, no prueba de mensaje enviado, venta o ingreso.
- `content_name=Impulso Local`, `content_category=whatsapp_click`, posición del botón y UTMs.
- No se asigna S/380 como valor de venta a los clics.
- Visitar o recargar /gracias no dispara Lead. Volver a pulsar WhatsApp no lo duplica cuando el navegador permite sessionStorage.
- Las UTMs se conservan en sessionStorage durante la sesión. No se guardan teléfonos ni contenido de conversaciones.
- La integración tiene el fallback noscript suministrado por Meta. Se documenta la medición en el pie de página.

### Revisión de la guía de eventos estándar de Meta

Fuente: [Especificaciones de los eventos estándar del píxel de Meta](https://eventsmanager.facebook.com/business/help/402791146561655?id=1205376682832142).

Meta define `ViewContent` para visitas a páginas relevantes, `Contact` para contacto con el negocio y `Lead` para envío de información de un posible cliente. La landing observa el clic de salida a WhatsApp; no puede confirmar por sí misma que se envió el mensaje.

Se añadió `ViewContent`. Se conserva temporalmente `Lead` como nombre del clic, según la configuración solicitada originalmente, hasta confirmar si hay campañas activas que dependen de él. La migración recomendada es usar `Contact` como intención de contacto y reservar `Lead` para un envío confirmado (formulario o integración de WhatsApp/CRM); antes de migrar, ajustar el evento de optimización de las campañas que usen el nombre anterior. No sumar esos eventos como si fueran personas diferentes.

No se instalan `Purchase`, `InitiateCheckout`, `AddToCart`, `CompleteRegistration` ni otros eventos para acciones que la landing no ofrece. No se reporta el precio del plan como ingreso por una visita o un clic.

Ejemplo de enlace para anuncios:

`https://crisdal-agency.vercel.app/?utm_source=meta&utm_medium=paid_social&utm_campaign=impulso_local&utm_content=plan380_v1`

## Conversions API (preparada, pendiente de credenciales)

El píxel funciona sin CAPI. Para habilitar el envío adicional desde el servidor, agregar en Vercel:

- `META_CAPI_ACCESS_TOKEN`: token de Conversions API. Es privado; nunca usar NEXT_PUBLIC_ ni incluirlo en Git.
- `META_GRAPH_API_VERSION`: versión de Graph API vigente y compatible con la cuenta (formato vXX.0).
- `META_TEST_EVENT_CODE`: opcional, para la herramienta Prueba de eventos; retirarlo para campañas reales.

El servidor envía el mismo `event_name=Lead` y `event_id` que el píxel, para deduplicación de Meta. Rechaza orígenes desconocidos, tipos y tamaños de datos inválidos; acota los campos y limita el tiempo de espera. Los errores de medición no bloquean el enlace a WhatsApp. Sin credenciales responde `202 not_configured`, nunca finge envío.

Verificar la recepción real y la deduplicación en el Administrador de eventos de Meta al activar CAPI. La prueba local usa interceptación de Meta para no contaminar las campañas con clics de QA. Un anuncio bloqueado o un bloqueador de rastreo puede impedir la medición del navegador.

## Referencias de competencia consultadas

Revisión de oferta y contenido, no auditoría de tasas de conversión. Consultadas el 3 de septiembre de 2026:

- [Rocoto Digital](https://www.rocotodigital.com/): plan Emprende S/499 al mes, 4 piezas gráficas, 2 videos y 2 campañas. Reafirma la utilidad de mostrar entregables y periodicidad juntos.
- [Web Express](https://www.webexpress.pe/): precios visibles y selección que llega a WhatsApp con contexto; explicita la inversión publicitaria aparte. Se adopta la claridad del precio y contacto directo.
- [Nur Creative Latam](https://www.nurcreativelatam.com/): distingue honorarios de publicidad y presupuesto en Meta. Se aplica esa separación junto al precio, en móvil y en FAQ.

Los servicios no son equivalentes; no se muestran comparaciones de ahorro engañosas. La nueva estructura es una hipótesis de mejora de conversión que debe validarse con tráfico real: clics a WhatsApp, conversaciones recibidas, leads calificados y ventas.

## Publicación y comprobación

Proyecto Vercel existente `crisdal-agency`, vinculado a `zam-ia/crisdal-agency`. La rama `main` publica la landing de producción. Antes de publicar: compilación, lint, revisión móvil/escritorio, destino WhatsApp, UTMs y ausencia de duplicados de Lead. La velocidad bajo una red móvil real debe comprobarse en producción; no se promete una cifra de carga sin medición.
