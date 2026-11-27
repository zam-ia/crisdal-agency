# Identidad y composición — Crisdal

Esta referencia es un contrato visual orientativo basado en el código del repositorio; **verificar siempre el HEAD actual** antes de editar.

## Dos universos, una marca

| | Web pública | Crisdal OS |
|---|---|---|
| Intención | emocionar, demostrar calidad, convertir | trabajar con precisión y rapidez |
| Fondo | carbón `#111210`, matices `#1a1a17` | marfil `#f6f5f1` o carbón `#111210` según tema |
| Superficie | marfil `#f4eee3`, papel `#faf7f0` | `#ffffff` en claro, `#20211e` y `#292a26` en oscuro |
| Acento | dorado CRISDAL `#fab713`, bronce `#6f4e2f` | dorado `#fab713`, hover `#e7a50b`, texto carbón `#111210` |
| Contraste | fuertes bloques de luz/oscuridad + foto | superficies tranquilas, estado operativo visible |
| Texto | editorial evocador, CTA sencillo | operativo directo, etiquetas sin ambigüedad |

No usar `#fab713` como fondo de grandes bloques ni turquesa como decoración pública. Los tonos deben revisarse en su contexto real de contraste AA. No introducir degradados arcoíris, glassmorphism en toda la interfaz, contornos dorados repetidos ni sombras saturadas.

## Tipografía

- Mantener las fuentes instaladas hasta decisión formal; el sitio usa actualmente títulos serif (Georgia) y cuerpo sans. No cargar Google Fonts adicionales por defecto.
- Hero público: máximo 2–3 líneas con quiebres pensados, `clamp()` responsivo; primera línea y énfasis sobrios.
- Cuerpo: `1rem` o mayor para párrafos, line-height cercano 1.5–1.75, ancho de lectura 55–75 caracteres.
- Administración: Inter, Segoe UI u otra sans instalada. Cuerpo 15–16 px, etiquetas 12–14 px, títulos con peso 500–650 y números tabulares.
- Nunca usar mayúsculas espaciadas en párrafos largos.

## Layout y medios

- Público: contenedor máximo aprox. 90rem, padding horizontal adaptable, ritmo vertical generoso. La portada de eventos debe llevar imagen real autorizada y CTA sin competir con ella.
- Imágenes del portafolio: 4:5 o 3:4 para retratos, 16:9 para video horizontal, 9:16 para reels. Conservar encuadre original, evitar `object-fit: cover` agresivo si corta rostros.
- Galería: alternar una imagen protagonista de gran tamaño y composiciones de 2 columnas; móvil una columna o carrusel con controles. Una foto fuerte vale más que 12 miniaturas pequeñas.
- Evento empresarial: composición más ordenada y documental; bodas/XV: narrativa editorial emotiva, SIN atribuir historias inventadas.
- Botones: uno principal por bloque; secundarios de menos peso. Evitar tres CTAs equivalentes en el primer viewport.

## Distinciones de navegación

**Público, orden preferido:** Eventos → Portafolio → Paquetes → Contacto; Contenido para negocios secundario (footer/menú completo).

**Portafolio filtros preferidos:** Bodas → Quinceaños → Corporativos → Celebraciones → Bautizos → Pedidas de mano → Sesiones → Detrás de cámaras → Negocios, con `Todos` si corresponde. No mostrar filtros vacíos como clicables sin explicar resultados.

**Admin navegación:** General, Comercial, Operaciones, Finanzas y Administración en escritorio. Inicio, Agenda, Crear, Finanzas y Más en móvil. Filtrar destinos y acciones por capacidades efectivas.

## Componentes estéticos de alto valor

- `HeroEvent`: imagen + gradiente corto para contraste + descripción + CTA; sin video autoplay con sonido.
- `EditorialProjectCard`: foto protagonista, título, etiqueta de evento, año solo si público, entrada de transición discreta.
- `MediaLightbox`: fondo carbón, imagen completa, navegación mediante flechas y teclado, cierre visible, foco controlado.
- `AvailabilityMiniCalendar`: colores diferenciados con **etiquetas textuales** y leyenda; desconocido nunca se presenta como disponible.
- `GlassActionBar`: flotante ligera solo cuando aporta acciones contextuales; fondo sólido alternativo para navegadores sin blur.
- `AdminProjectWizard`: siete pasos breves, persistencia comprobada, resumen de publicación y errores recuperables.

## Copy y conversión

- Acción destacada de eventos: "Consultar disponibilidad" o "Cotizar mi evento".
- Otras acciones: "Ver nuestros trabajos", "Explorar paquetes", "Compartir proyecto".
- Diferenciar "Solicitud enviada", "Consulta recibida", "Fecha por confirmar" y "Reserva confirmada"; son estados legales/operativos distintos.
- Promociones: solo vigencia, descuentos y disponibilidad comprobables; no fake countdowns. Preferir banner contextual sobre popup a la apertura.
- Nunca publicar listas de clientes, locales o fechas vinculadas a terceros sin autorización.

## Tokens administrativos y ritmo

- Texto claro `#171816` sobre superficies claras. Texto oscuro en tema oscuro se reemplaza por marfil `#f4eee3` y secundario `#b6b8b1`. Toma los valores definitivos de `app/ui/os/os-tokens.css`.
- Usa una escala de 4, 8, 12, 16, 20, 24, 32, 40 y 48 px. Tarjetas de 20–24 px de radio y hasta 32 px para el próximo evento. Reservar dorado para acciones y selección. Verde, ámbar, rojo, azul y violeta señalan estados o categorías con texto.
- Empezar con el tema del sistema. Mantener únicamente la preferencia de color en almacenamiento local. Las referencias de Focali orientan los flujos y la jerarquía. Conservar composición, marca, contenidos y recursos propios de Crisdal.