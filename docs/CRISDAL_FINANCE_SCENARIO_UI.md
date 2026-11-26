# Crisdal OS · Simulador de cobros y caja
El nuevo módulo de `/panel/finanzas` agrega una primera UI al cálculo de cuentas por cobrar existente. El permiso `finance.read` se verifica en servidor antes de renderizar. El acceso se ofrece en Configuración y usa el mismo permiso, sin modificar el menú compartido con las ramas de cotizaciones ni entregas privadas.

No hay conexión del simulador a Supabase, API de escritura, datos demo precargados, persistencia, exportación, contabilidad ni conversión. La página protegida sí usa la autenticación existente de Crisdal OS. Cambiar moneda o recargar descarta el escenario.

## Integración en staging
- Probar con owner o finanzas, después con un rol sin `finance.read`. Este último no debe ver el enlace y la ruta debe redirigir a Inicio.
- En 320, 390, 768 y 1440 px, revisar foco por teclado, lectura de errores y distribución de componentes.
- Con PEN 1190 por cobrar, 300,50 cobrado, 20,25 devuelto y 80 de gasto, deben verse 280,25 netos, 909,75 pendientes y 200,25 de efecto en caja. Ingresar devolución superior a cobros y verificar que no se muestre un total engañoso.
- No migrar ni publicar automáticamente. La persistencia real queda para Codex, con permisos por operación, transacciones y auditoría.
