# Crisdal OS · Entrega operativa diaria

La integración del PR #29 parte del commit de producción `b374275` e incorpora los cambios de la rama `parallel/crisdal-public-polish` tras revisar las diferencias con `main`. También incorpora el asistente guiado y las mejoras de finanzas hasta `e02d31c`.

## Consolidación

- El fallo reproducido del Preview estaba en `app/api/panel/operations/route.ts`. La expresión que escapaba los comodines de la búsqueda quedó interrumpida por fragmentos de la consulta de cotizaciones. Tras resolver la sintaxis, el typecheck encontró dos contratos de JSON sin validar. Las solicitudes de fechas y la disponibilidad vuelven a validar cada campo en servidor.
- La integración conserva la función SQL productiva que calcula la disponibilidad a partir de toda la agenda. Los once archivos de migración aplicados se mantienen idénticos a `main`.
- Se integraron la protección de peticiones, el recorrido contextual de fechas, los filtros operativos globales, la búsqueda de clientes para cotizar, el texto para compartir, las sugerencias de producción, la exportación CSV por alcance y la base PWA.

## Interfaz y flujos

- Identidad propia con dorado, carbón, marfil y tokens administrativos de tema claro, oscuro o de sistema. El dock móvil y las acciones rápidas usan los permisos de la sesión. Los diálogos admiten Escape.
- **Hoy en Crisdal** muestra el siguiente evento confirmado y consulta el total real de pendientes y saldos con permisos. La agenda mensual selecciona días y abre el formulario con fecha precargada.
- **Paquetes** conserva los precios y entregables existentes. El catálogo permite elegir tipo de evento y continuar a la consulta de fecha. Los enlaces de selección se pueden copiar, abrir, enviar por WhatsApp y revocar.
- **Finanzas** permite enlazar una boleta emitida a un cobro previo y exportar hasta 5000 movimientos o comprobantes del mes por moneda. Los informes incluyen datos contables privados y requieren permiso de lectura financiera.
- **Portafolio** conserva el borrador al subir imágenes, muestra progreso y permite reintentar. La ficha pública sigue dependiendo de la portada válida y del respaldo de autorización.
- Las dos imágenes editoriales del catálogo son detalles de cobertura sin nombres. Se exportaron como WebP con orientación corregida y metadatos retirados. La selección del primer proyecto se preparó localmente para su publicación luego de registrar autorización.

## Datos y condiciones de activación

- Remoto verificado de solo lectura para esta entrega: 11 migraciones, un perfil propietario activo, seis paquetes publicados, cero proyectos publicados y 21 objetos de Storage antes de iniciar. El bucket privado conserva acceso privado.
- Entregas privadas permanecen deshabilitadas. La restricción SQL de coincidencia de horarios sigue como candidata hasta confirmar la capacidad de equipos y ensayar el cambio sobre un respaldo actualizado.
- La publicación del primer trabajo y la revisión del guardado real del CMS requieren la sesión del propietario y evidencia de autorización web. No se generaron cobros, solicitudes, galerías ni comprobantes de prueba en producción.
- Los precios «desde», la disponibilidad por equipo, propuestas PDF con enlace revocable y el registro de vencimientos contractuales requieren decisiones y persistencia adicional. Los módulos actuales conservan sus flujos.
- La PWA usa manifiesto, iconos y acceso por navegador. Los registros operativos y las finanzas requieren conexión.

## Verificaciones de la entrega

- Compilación de producción y lint sin errores. 138 pruebas automatizadas aprobadas y auditoría de dependencias sin vulnerabilidades notificadas.
- Navegador Chromium con datos aislados y respuestas controladas. Nueve anchos entre 320 y 1920 px en Inicio y catálogo; tema persistente, regreso de foco con Escape, acciones visibles por permiso, fecha precargada en Agenda, selección y revocación del enlace comercial y validación, cola, progreso y reintento de fotos en Portafolio.
- El acceso real del propietario y el recorrido de escritura sobre Supabase siguen pendientes. Mantener producción en su versión actual hasta validar ese recorrido y comprobar el Preview. La instalación PWA real en Windows tampoco se ha validado.

[Guía rápida para el propietario](CRISDAL_GUIA_RAPIDA_PROPIETARIO.md)
