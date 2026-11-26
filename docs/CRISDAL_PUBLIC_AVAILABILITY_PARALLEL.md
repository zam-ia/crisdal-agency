# CRISDAL — Calendario público, solicitud de fechas y bandeja de leads

**Rama propuesta:** `parallel/crisdal-public-availability`  
**Base original:** `b8b037a566e7de45bbfe407de970aad5f5afa02b`  
**Propósito:** entrega paralela independiente; Codex trabaja actualmente en fases 4D y 5A. **No fusionar ni publicar automáticamente.**

## Diferencial comercial y de UX

- La web prioriza experiencias de fotografía y video de eventos: una fecha y un tipo de evento en el formulario, sin obligar al visitante a buscar el número de WhatsApp.
- Calendario responsive, navegación mensual, estados de disponibilidad, selección de fecha y formulario en un solo recorrido.
- Estética editorial carbón/marfil/dorado con superficies de vidrio translúcido **sutiles**; contraste, estados de carga/error y `prefers-reduced-motion`. Nada de animaciones pesadas ni distorsiones artificiales en fotografías.
- **Nunca muestra quién reservó, ubicación, duración, equipo, clientes ni número de eventos internos.**
- Datos no verificados, caducados o fallidos se muestran como **Consultar**. Solamente datos verificados recientes podrán mostrar **Disponible** o **Sin disponibilidad**.
- Ninguna consulta reserva el día ni confirma equipo o precio. La disponibilidad por día no implica disponibilidad para todos los horarios ni todas las categorías de eventos.
- Como alternativa se ofrece WhatsApp contextual al `51992566725`; la solicitud web tiene confirmación separada y nunca informa éxito si la persistencia falla.

## Referentes estudiados

- HoneyBook, Public Availability Calendar: una cuadrícula pública que muestra disponibilidad pero oculta nombres y detalles de eventos (https://help.honeybook.com/en/articles/17709523-public-availability-calendar).
- Pixieset Studio Manager: selección de servicios, consulta de fechas y experiencia móvil (https://help.pixieset.com/hc/en-us/articles/8379317938701-Getting-Started-with-Booking-Scheduling).
- Tendencia aplicada: fotografía protagonista, consulta contextual breve, galería de alta calidad y formularios con el menor número razonable de pasos. Evitar obligar al visitante a abrir un tercero antes de elegir qué necesita.

## Entregas de código

### Público

- `app/consultar-fecha/page.tsx` — ruta autónoma para que Codex agregue los enlaces en `/eventos` y el portafolio sin conflicto de archivos.
- `app/ui/availability/public-availability.tsx` y su CSS Module — experiencia completa móvil/desktop con formulario y estados.
- `app/lib/availability/public-calendar.ts` — construcción pura de calendario con zona `America/Lima`, ventana máxima de 12 meses, caducidad y privacidad.
- `app/lib/availability/inquiry.ts` — validación y texto de consulta WhatsApp.
- `app/api/public/availability/route.ts` — GET seguro del mes; en fallo no inventa fechas disponibles.
- `app/api/public/date-requests/route.ts` — POST de consulta con límites de cuerpo, validación, comprobación de origen, honeypot, HMAC y rate limit transaccional en SQL.

### Administración

- `app/panel/solicitudes-fecha/` — bandeja de solicitudes recibidas, contacto WhatsApp, estados no equivalentes a una reserva.
- `app/panel/disponibilidad-publica/` — editor temporal de fechas públicas. Publicar `Disponible` requiere aceptación explícita de verificación y caduca a las 12 horas; los cambios se auditan.
- `app/api/panel/date-requests/route.ts` y `app/api/panel/public-availability/route.ts` — autorización mediante capacidades; el acceso a datos de contacto requiere **clientes.read + calendario.read**, y las mutaciones sus capacidades correspondientes.

### Persistencia

- `supabase/migrations/20261126120000_crisdal_public_availability_inquiries.sql` — calendario público agregado de solo fecha/estado y tabla **privada** de leads; RLS, revocación de privilegios, funciones `service_role`, limitación persistente de envíos y auditoría para mutaciones.
- Pruebas de dominio y comprobaciones estáticas SQL en `tests/`.

## Activación real — advertencia

1. Las migraciones de identidad de la fase 3 siguen **sin aplicar** en producción. Esta migración depende del esquema de auditoría de fase 3. **No ejecutarla todavía en Supabase real.**
2. Codex debe integrar los archivos en `codex/crisdal-premium-os` una vez finalice 4D/5A, revisar conflictos y ejecutar lint, TypeScript, tests, build, pgTAP y pruebas E2E.
3. Crear proyecto Supabase de prueba aislado. Aplicar identidad, comercial y por último esta migración; verificar funciones SQL, RLS, `anon` sin permiso y el rol `owner`.
4. Probar flujo E2E: ver mes → seleccionar fecha → enviar consulta → obtener ID real → ver en `/panel/solicitudes-fecha` → actualizar estado → comprobar auditoría.
5. Probar publicación manual verificada y caducidad. La **agenda transaccional de Codex** debe sustituir las verificaciones manuales: al confirmar/modificar/cancelar una reserva, invalidar o recalcular inmediatamente las fechas públicas afectadas, evitando falsos positivos.
6. Añadir acceso a las rutas en el menú comercial y sidebar **solo después de integrar**. No modificar `app/page.tsx`, `app/eventos/page.tsx`, `app/ui/os/panel-shell.tsx` ni otros archivos actualmente activos de Codex desde esta rama.
7. Establecer política de privacidad y retención de datos: consentimientos visibles, acceso por rol y eliminación tras el plazo legal/operativo establecido. Revisar con asesoría legal antes del uso público.
8. No hay reservas automáticas, bloqueo de disponibilidad en la entrega, pagos ni asignación de recursos. Se necesita transacción en servidor con revalidación de conflictos y confirmación explícita del equipo.
9. Hasta activar Supabase, el formulario muestra fallo de persistencia y ofrece WhatsApp; la página nunca presenta fechas inventadas en verde.

## Riesgos conocidos a revisar al integrar

- El backend confía en IP de infraestructura (`x-real-ip` / `x-forwarded-for`) para rate limit; confirmar encabezados confiables en Vercel y, si es necesario, usar un proveedor durable de mitigación adicional.
- Estados manuales `Disponible` pueden perder vigencia si surge una nueva reserva antes de la caducidad. El sistema de agenda debe invalidar la proyección **en la misma operación de confirmación**, nunca depender de una tarea eventual.
- Una fecha global no garantiza servicios simultáneos o multi-día; crear contratos de capacidad por servicio/recurso cuando la agenda real los tenga.
- Antes de uso público, definir y publicar política de datos y consentimiento adecuado a Perú.
- No se ha ejecutado el SQL contra una base PostgreSQL real desde este entorno. La migración requiere pgTAP y una prueba con esquema Supabase aislado.

## Validaciones realizadas y pendientes

- Código de disponibilidad y formularios: **8/8 pruebas de dominio locales** con Node 22 y TypeScript estricto.
- SQL: comprobaciones de invariantes estáticas locales (`public-availability-sql.test.ts`). No son una sustitución de pgTAP.
- Archivos TS/TSX: análisis sintáctico con compilador TypeScript, sin errores.
- Suite Next.js completa, ESLint, TypeScript de toda la aplicación, build y pruebas de navegador quedan a Codex una vez integrado; las dependencias del repositorio no se instalaron aquí.

## Checklist funcional para Codex

- [ ] Autenticación y permisos en rutas admin.
- [ ] Test de no exposición de clientes en GET público.
- [ ] Test de caducidad del estado verde.
- [ ] Test de 429 por abuso del formulario.
- [ ] Test 401/403 en las APIs privadas.
- [ ] Test de atomicidad del estado y auditoría.
- [ ] Test de guardado y lectura en Supabase aislado.
- [ ] Test de móvil 390 px, desktop 1280 px, accesibilidad y reduced-motion.
- [ ] Enlazar desde `/eventos`, portafolio, paquetes y CTAs solamente tras verificar integración.
- [ ] Consentimiento, aviso de privacidad, identidad comercial y WhatsApp correctos.

**NO considerar este módulo desplegado ni plenamente operativo hasta ejecutar esas pruebas y activar un entorno de base de datos autorizado.**
