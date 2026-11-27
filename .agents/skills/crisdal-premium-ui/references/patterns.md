# Recipes UX: cliente, fotos, reservas y panel

Usar únicamente cuando la pantalla correspondiente esté dentro de la tarea. No transformar todas las rutas en una sola ejecución.

## Recorrido visitante — eventos

1. **Descubrir:** hero con fotografía real, tipo de evento y CTA. El usuario debe saber en 5 segundos qué hace Crisdal.
2. **Comprobar calidad:** proyectos publicados, galería real, categoría, formatos de video; ficha con multimedia accesible.
3. **Evaluar:** paquetes con entregables aprobados o "Consultar precio" si no están aprobados; no mezclar precio de contenido con evento.
4. **Consultar fecha:** seleccionar una fecha / tipo de evento / lugar; estados de calendario verificados y privacidad estricta. No suponer que fecha libre implica personal disponible.
5. **Solicitar:** formulario accesible + WhatsApp como alternativa. Persistir una consulta no equivale a confirmar una reserva.
6. **Confirmación:** explicar qué sucederá después, sin prometer respuesta en tiempo fijo no acordado.

## Recorrido administrador — publicar trabajo

1. Elegir categoría (Boda, XV, Corporativo, otros).
2. Crear borrador y guardar **antes** de subir multimedia.
3. Cargar fotografías mediante flujo con progreso/error individual, reintentos y respaldo privado.
4. Añadir videos aprobados (YouTube/Vimeo y TikTok/Facebook si la integración es compatible) bajo demanda; dar siempre salida a plataforma original.
5. Elegir portada, ordenar medios, indicar textos `alt` y comprobar recortes 390/1440 px.
6. Registrar prueba y alcance de autorización; no publicar por el solo cambio de checkbox.
7. Vista previa real del diseño móvil/desktop; publicar en servidor; copiar URL **solo si publicado**.

## Componentes: contrato de estado

| Componente | Loading | Vacío | Error | Correcto |
|---|---|---|---|---|
| Portafolio | skeleton con relación de aspecto | trabajos pendientes, sin casos falsos | problema temporal + reintentar | tarjetas y filtros funcionales |
| Calendario | mes con shimmer discreto | "Consultar disponibilidad" | no marcar días como libres | "Disponible", "Sin disponibilidad" o "Consultar" con leyenda |
| Consulta | botón deshabilitado durante envío | campos limpios, etiquetas | errores junto a campos, preservar contenido | número/referencia real solo si existe |
| Galería | reservar espacio | mensaje honesto | poster/enlace externo | foto/video responsive |
| Admin subida | progreso por archivo | arrastrar/seleccionar | permitir reintento | miniatura + estado confirmado |

## Calendario: prioridad UX y privacidad

- Mes actual claro, selector previo/siguiente con límites, días fuera del rango deshabilitados y explicados.
- Cada celda usable por teclado; estados legibles sin depender únicamente de color.
- Etiquetas públicas de máximo 3 estados, sin nombre de cliente, lugar, motivo o título del bloqueo.
- Verificado = datos administrativamente confirmados, con vencimiento si la fuente no se sincroniza.
- No anunciar `Reservado` si únicamente hay solicitud pendiente; usar `Consultar` o `Sin disponibilidad` según la política y fuente confirmadas.
- No permitir reservas automáticas desde selección de día; el CTA crea una **consulta**.
- Selección permanece visible al navegar al formulario o a WhatsApp.
- Para disponibilidad ligada a múltiples equipos/cámaras, no calcular libre solo por ausencia de un evento; delegar al motor de agenda.

## "Liquid glass" sin deuda técnica

Solo en `nav`, `action bar` o encabezados pequeños, opcional:

```css
.glassBar {
  background: rgb(17 18 16 / 82%);
  border: 1px solid rgb(244 238 227 / 18%);
  box-shadow: 0 12px 36px rgb(0 0 0 / 18%);
}
@supports ((backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px))) {
  .glassBar {
    background: rgb(17 18 16 / 62%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .glassBar { transition: none; }
}
```

Usar el color correcto del contexto público/admin. No introducir filtros grandes sobre fondos complejos o reproductores. Si el texto pierde contraste, cambiar a fondo opaco.

## Motion

- `120–180ms` para botones, `180–260ms` para tarjetas y `220–320ms` para diálogos y hojas.
- `opacity` y `transform` primero; evitar animar `height`/`width`, blur masivo, `filter` continuo y scroll hijacking.
- Sin animaciones automáticamente repetitivas o parallax global.
- No animar componentes si cambia el layout de forma que desplaza el CTA.
- `prefers-reduced-motion: reduce`: mostrar contenido inmediatamente sin desplazamientos/zooms.
- Cambios de estado críticos (reserva, pago, subida, publicación) priorizan feedback claro sobre efectos.

## Panel: UX operativa

- Nav escritorio lateral y nav móvil inferior solo con destinos implementados y permitidos.
- Formularios largos: wizard con pasos persistidos y `Guardar borrador`.
- Datos monetarios en PEN tabulares; valores "pendiente" solo desde datos reales.
- Acciones irreversibles: confirmación específica y feedback servidor.
- Si el usuario no tiene permisos, no renderizar CTA y también denegar API.
- Evitar modales en modales. Usar bottom sheet móvil con scroll y botón de cerrar fuera del teclado.
- Nunca usar placeholder como etiqueta única del campo.

## Medios reales

No usar imágenes sintéticas como trabajos realizados. Optimizar derivadas WEB únicamente después de controlar permisos sobre los originales. No editar píxeles de rostros para producir tarjetas "más estéticas". Preferir un encuadre natural y una portada distinta si el crop corta caras.

### Coordinación diaria

- Inicio responde por el siguiente evento, nuevos contactos, saldos, vencimientos y accesos. Usa consultas completas para agregados. Distingue cero, ausencia de permiso y fuente inaccesible.
- Dock flotante con safe areas y alternativa opaca. El botón Crear abre un diálogo con acciones habilitadas. Escape cierra y devuelve el foco. Las hojas de compartir muestran la selección, el mensaje y las acciones efectivamente disponibles.
- La agenda usa hora Lima y muestra categorías reales con leyenda. La consulta pública conserva evento y paquete hasta el formulario. En una página compartida se muestran solo las opciones enviadas.