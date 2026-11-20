# Estado de integración GKDS Fitness

## Integración y módulos

- [x] **Conexión segura frontend–backend:** El navegador usa únicamente el BFF del mismo origen (`/api/backend/...`); Next reenvía al NestJS privado configurado por `API_URL` hacia `/api/v1`. Access/refresh permanecen en cookies `HttpOnly`; las respuestas de autenticación no exponen tokens en el JSON cliente.
- [x] **Sesión y roles:** Login, registro y logout conectados. La navegación se filtra por rol en el frontend; las autorizaciones reales siguen en guards del backend. Sin sesión, `/api/backend/auth/me` responde 401 y no entrega datos.
- [x] **Registro público de miembros:** Formulario conectado a `POST /users` mediante el BFF, rol definido por el servidor, validación y mensajes de duplicado/error; comparte composición visual con login y conserva los campos del DTO `CreateUserDto`.
- [x] **Membresías, planes y acceso:** Consulta/administración de planes, membresía, compra/renovación y directorio. Recepción busca por nombre o número y selecciona la persona; no necesita conocer UUID. Renovación exige membresía seleccionada.
- [!] **Clases grupales, reservas y asistencia:** Calendario semanal, reservas/cancelaciones, gestión de plantillas, generación de sesiones desde plantillas, edición de sesión futura, asistencia y cierre conectados a endpoints. Límite contractual: el DTO administrativo disponible no expone cantidad de reservas a cancelar ni nombres asociados en el listado; no se inventaron esos datos.
- [x] **Sesiones personales y entrenador:** Disponibilidad, búsqueda de entrenadores, agendamiento y cancelación, lista del miembro y acceso a clientes/progreso/rutinas mediante endpoints reales. H10 se presenta a $10.00 USD conforme al PDF y al backend entregado.
- [x] **Pagos, cobros y comprobantes:** Pagos pendientes/historial, pago de miembro, cobro en recepción, anulación y visualización/descarga de comprobantes conectados mediante BFF a contratos reales.
- [x] **Progreso y rutinas:** Captura/edición/evolución personal; consulta de clientes asignados; gráficas de peso, medidas y marcas por ejercicio; creación de nuevas versiones de rutina e historial. Sin datos ficticios; la evolución requiere dos o más puntos medibles.
- [!] **Máquinas, mantenimiento, reseñas y notificaciones:** Listados, mantenimiento, promedios y bandeja conectados. Límite contractual: el modelo/endpoint H29 actual solo ofrece sesiones de clase (`ClassSession`) como elegibles para reseñar; no permite evaluar sesiones personales. El frontend conserva ese contrato y no simula reseñas personales.
- [x] **Reportes por rol:** Ingresos, ocupación, renovaciones y desempeño/calificaciones conectados a datos del backend.
- [x] **Diseño y responsividad:** Tema claro con franja GKDS Navy, navegación por rol, superficies claras y acento teal. Se auditaron 45 CSS Modules: 41 tienen media queries; las otras cuatro corresponden a páginas de índice/redirección. No hay reglas `prefers-color-scheme: dark` en los estilos de aplicación.

## Backend y verificación

- [x] **Corrección H8:** `20261119020000_h8_attendance_completion/migration.sql` conserva solo el `CHECK` nuevo para auditoría del cierre; no vuelve a declarar `completed_at`, `completed_by_id` ni su FK, creadas por la migración anterior.
- [x] **Compatibilidad de autenticación para el frontend:** El login devuelve usuario y tokens conforme al contrato consumido por Next; la sesión se guarda en cookies `HttpOnly`. No se incluyeron secretos ni `.env` real.
- [x] **Validación frontend:** `npx tsc --noEmit` sin errores; `npm run lint` exit code 0 (quedan 6 advertencias de dependencias de hooks); `npm run build` exit code 0 y 49 rutas Next detectadas.
- [x] **Smoke HTTP frontend:** `/login` y `/registro` responden 200; `/api/backend/auth/me` responde 401 sin sesión, como corresponde.
- [x] **Backend adjunto:** `npm run build` y `prisma migrate deploy` completaron en la copia desechable tras corregir H8; `npm test` pasó 48 archivos/259 pruebas; `npm run lint` terminó con 0 errores y 1 advertencia.
- [!] **Batería HTTP exhaustiva de rutas NestJS:** No se ejecutó el runner completo de las 74+ operaciones: requiere Node 24 y PostgreSQL 18; el entorno disponible tiene Node 22 y PostgreSQL 16. Sí se verificaron las rutas del flujo y las que aparecían fallando en capturas. No se afirma que las 74+ operaciones hayan pasado ahora.
- [x] **Flujo de aceptación solicitado (BFF + backend):** La página `/registro` respondió 200; tres altas nuevas respondieron 201 y recibieron rol `MIEMBRO`; con solicitud de membresía desde recepción, cada miembro pagó con la simulación H16, consultó su historial, descargó PDF (200) y recibió una notificación no leída. Todo ocurrió en una base PostgreSQL desechable, sin cargos reales.
- [x] **Entrega limpia:** Frontend y backend incluidos en ZIP separados y verificados; se excluyeron `.env` real, `node_modules`, `.next`, `dist` obsoleto, pnpm lockfile duplicado y archivos temporales. No se publicó ni modificó GitHub.
