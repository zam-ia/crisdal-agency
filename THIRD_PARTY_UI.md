# Referencias y dependencias de interfaz

## Motion for React

- Fuente: https://motion.dev/docs/react
- Paquete: `motion`
- Licencia: MIT
- Uso: animación de entrada del hero, progreso de scroll y revelado progresivo de bloques.
- Adaptación: componentes locales, soporte para `prefers-reduced-motion` y contenido completo sin JavaScript de animación.

## Catálogo revisado

| Fuente | Patrón aplicado | Integración |
| --- | --- | --- |
| shadcn/ui | Accordion accesible, botones y tarjetas | Semántica local; el FAQ mantiene un solo elemento abierto y navegación por teclado. |
| Magic UI | Hero Video Dialog, Animated Beam, Bento Grid y Scroll Progress | Adaptación local con fachada de video diferida, ruta animada, grilla asimétrica y progreso superior. Magic UI usa licencia MIT. |
| Motion Primitives | InView y Animated Group | Adaptación local sobre `motion`; el repositorio está publicado bajo licencia MIT. |
| Aceternity UI | Background Lines, capas de luz y CTA de cierre | Inspiración visual recreada con CSS propio. No se copió código ni assets del registry. |
| React Bits | Blur reveal y microinteracciones | Inspiración aplicada mediante Motion propio. No se copió código; su licencia actual es MIT con Commons Clause. |
| Osmo | Ritmo de scroll, superposición de secciones y profundidad | Referencia visual únicamente; implementación propia sin copiar recursos. |
| 21st.dev | Descubrimiento y comparación de patrones | No se incorporó código comunitario ni assets de autores externos. |
| Lenis | Smooth scroll | Revisado y descartado: el scroll nativo conserva mejor rendimiento, anclas y comportamiento móvil para esta landing. |

## Criterio de integración

Se mantuvo una sola librería de movimiento. Los fondos, tarjetas redondeadas, transiciones entre secciones y capas luminosas son código propio basado en los tokens de Crisdal. No hay imágenes demo, CDNs visuales ni dependencias duplicadas.
