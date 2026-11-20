# Plan de integración GKDS

## Enfoque
Mantener la base recibida (Next.js 16 App Router + TypeScript) y conectar las pantallas a la API NestJS/PostgreSQL por medio del BFF de Next. El navegador solo llama rutas relativas `/api/backend/...`; el servidor Next llama a `API_URL` (base `/api/v1`). Los tokens access y refresh permanecen en cookies `HttpOnly`; el backend sigue siendo la autoridad de autenticación/autorización y reglas de negocio. No introducir datos simulados en las pantallas finales.

## Estructura del proyecto
- `app/`: páginas App Router agrupadas por dominio GKDS (miembro, entrenador, administración, recepción, clases, pagos, progreso, notificaciones, reportes y máquinas).
- `app/api/backend/[...path]/route.ts`: pasarela same-origin para solicitudes del navegador, incluyendo reintento de refresh cuando corresponda.
- `app/actions/`: acciones de servidor para login/logout y formularios que convenga procesar en servidor.
- `app/components/`: navegación y componentes compartidos de marca, formularios, estados vacíos/errores y presentación.
- `lib/`: cliente BFF, URL upstream, cookies/sesión y formatos compartidos.
- `prisma/` y `src/` del backend: corregir solamente el DDL duplicado confirmado de H8, manteniendo la auditoría CHECK que sí aporta.

## Diseño y responsive
Tomar Figma-software como fuente visual: encabezado azul marino GKDS, navegación lateral clara, fondo gris azulado muy pálido, tarjetas blancas con bordes suaves y acento turquesa/verde azulado para acción/estado activo. Reutilizar los controles y jerarquías de las capturas; no añadir imágenes decorativas a una aplicación administrativa. En móvil, la navegación lateral se convierte en un menú compacto, tablas se adaptan con desplazamiento o tarjetas legibles, formularios pasan a una columna y los botones conservan áreas táctiles cómodas.

La página `/registro` reutiliza la composición dividida y la paleta de `/login` (marca y mensaje GKDS sobre panel marino, formulario sobre superficie clara), adaptada a móvil. Conserva los campos del backend: nombre completo, correo, teléfono opcional y contraseña; el rol no se elige en el cliente, el servidor asigna `MIEMBRO`.

## Alcance funcional
Completar las rutas presentes o ausentes para cubrir los flujos de las historias del PDF: autenticación/registro y paneles por rol; membresías/planes; calendario, reservas y asistencia; agenda/disponibilidad de entrenador y sesiones personales; pagos/cobros/anulación/comprobantes; progreso/rutinas; máquinas/mantenimiento; reseñas/notificaciones; reportes. Usar contratos y permisos existentes en el backend, conservar estados vacíos/error/carga y no presentar datos ficticios como reales.

## Entregables
Un ZIP del frontend conectado y un ZIP del backend recibido con la corrección H8. No se publica ni se escribe en GitHub. Se excluyen `.env`, `node_modules`, cachés y resultados temporales.
