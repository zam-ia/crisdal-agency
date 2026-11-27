# Estabilización de Crisdal OS

Se integró el cambio específico de `3dbbd46` sobre la versión productiva `7dbd497`. La guía del propietario conserva los pasos de vinculación SUNAT, exportación mensual, Excel y Drive.

- Finanzas bloquea la edición durante el envío. Si se pierde la confirmación, el formulario conserva el identificador de operación y acepta el reintento con los mismos datos. La protección se mantiene mientras el formulario esté abierto. Antes de repetir después de cerrar, revisa los registros.
- Finanzas y Portafolio protegen los cambios pendientes al navegar o cerrar sesión. Portafolio coordina la carga, el guardado, los enlaces, el orden y el retiro de medios dentro de la sesión de edición.
- La autorización se lee y edita en hora de Lima y se guarda como un instante UTC. El asistente muestra los requisitos pendientes de publicación con la misma validación de portada, medios y autorización que usa el servidor.
- Lint, TypeScript, 141 pruebas automatizadas y build de producción aprobados. Las pruebas de navegador usaron datos aislados para simular el reintento financiero, el paso de cobro a boleta y la publicación validada.
- Las migraciones y los registros existentes de Supabase se preservan. Las entregas privadas siguen deshabilitadas.
