# Documentación de la API

## 1. Introducción

El Sistema de Gestión de Gimnasio GKDS utiliza una API REST desarrollada con **NestJS y TypeScript**.

La API permite la comunicación entre el frontend desarrollado con Next.js y la base de datos PostgreSQL, utilizando Prisma ORM.

El backend es responsable de:

- Procesar las solicitudes enviadas por el frontend.
- Aplicar las reglas de negocio.
- Validar la información recibida.
- Gestionar la autenticación y autorización.
- Consultar y actualizar la información almacenada en PostgreSQL.
- Devolver respuestas HTTP a los clientes.

## 2. Direcciones de la API

### Backend en producción

**Plataforma:** Render

**URL base del servidor:**

https://be-boilerplate-is-2026-dqyw.onrender.com

### Documentación Swagger

**URL prevista de Swagger:**

https://be-boilerplate-is-2026-dqyw.onrender.com/api/docs

Swagger permite consultar los endpoints, los parámetros requeridos, los cuerpos de las solicitudes y las respuestas documentadas.


## 3. Arquitectura de comunicación

La comunicación entre los componentes sigue este flujo:

1. El usuario accede al frontend desplegado en Vercel.
2. El frontend envía solicitudes a los servicios del backend.
3. El backend verifica la autenticación y los permisos cuando corresponde.
4. Los controladores reciben las solicitudes y delegan las operaciones a los servicios.
5. Los servicios aplican las reglas de negocio.
6. Prisma ORM permite realizar las operaciones necesarias sobre PostgreSQL.
7. El backend devuelve la respuesta HTTP correspondiente.

## 4. Autenticación y autorización

El backend utiliza mecanismos de autenticación basados en JWT.

Los roles contemplados por la aplicación son:

| Rol | Descripción |
|---|---|
| `MIEMBRO` | Usuario que utiliza los servicios del gimnasio |
| `ENTRENADOR` | Personal encargado de sesiones, asistencia y rutinas |
| `RECEPCION_ADMIN` | Personal responsable de administración, membresías, cobros e ingresos |

Cuando la implementación utiliza autenticación mediante un token Bearer, el encabezado HTTP sigue este formato:

```http
Authorization: Bearer <token>
```

El backend también contempla configuración para tokens de renovación.

### Códigos de respuesta HTTP

| Código | Significado |
|---|---|
| `200` | Solicitud procesada correctamente |
| `201` | Recurso creado |
| `204` | Operación completada sin contenido |
| `400` | Datos o parámetros inválidos |
| `401` | Usuario no autenticado |
| `403` | Usuario sin permisos |
| `404` | Recurso no encontrado |
| `409` | Conflicto con las reglas de negocio |
| `500` | Error interno del servidor |


## 5. Endpoints por módulo

Las rutas que se presentan a continuación corresponden a las definiciones de las historias de usuario. 

### 5.1. Módulo 0: Usuarios y autenticación

El módulo de autenticación administra el acceso a la aplicación y la identificación de los usuarios.

**Operaciones contempladas:**

- Inicio de sesión.
- Registro de miembros.
- Gestión y renovación de sesión.
- Consulta del perfil autenticado.
- Autorización por roles.


### 5.2. Módulo 1: Membresías y planes

Permite administrar los planes y las operaciones de compra o renovación de membresías.

| Método | Endpoint de la especificación | Rol | Función |
|---|---|---|---|
| GET | `/api/memberships/me` | MIEMBRO | Consultar membresía propia |
| GET | `/api/membership-plans` | RECEPCION_ADMIN | Consultar planes |
| POST | `/api/membership-plans` | RECEPCION_ADMIN | Crear plan |
| PATCH | `/api/membership-plans/:id` | RECEPCION_ADMIN | Modificar plan |
| GET | `/api/membership-plans?status=ACTIVO` | RECEPCION_ADMIN | Consultar planes activos |
| POST | `/api/memberships/purchases` | RECEPCION_ADMIN | Solicitar compra |
| POST | `/api/memberships/:id/renewals` | RECEPCION_ADMIN | Solicitar renovación |

**Reglas de negocio principales:**

- Las operaciones deben utilizar planes habilitados.
- Deben comprobarse las condiciones de compra y renovación.
- Una solicitud de compra o renovación no implica por sí sola la confirmación del pago.
- La vigencia de la membresía debe actualizarse según el flujo de pago implementado.

### 5.3. Módulo 2: Clases grupales

Permite consultar sesiones grupales, reservar cupos y registrar asistencia.

| Método | Endpoint de la especificación | Rol | Función |
|---|---|---|---|
| GET | `/api/class-sessions` | MIEMBRO | Consultar sesiones |
| POST | `/api/class-reservations` | MIEMBRO | Reservar cupo |
| GET | `/api/class-reservations/me` | MIEMBRO | Consultar reservas |
| PATCH | `/api/class-reservations/:id/cancel` | MIEMBRO | Cancelar reserva |
| POST | `/api/class-templates` | RECEPCION_ADMIN | Crear plantilla |
| PATCH | `/api/class-templates/:id` | RECEPCION_ADMIN | Modificar plantilla |
| POST | `/api/class-templates/:id/sessions` | RECEPCION_ADMIN | Generar sesiones |
| PATCH | `/api/class-sessions/:id/cancel` | RECEPCION_ADMIN | Cancelar sesión |
| GET | `/api/class-sessions/:id/attendees` | ENTRENADOR asignado | Consultar asistentes |
| PATCH | `/api/class-reservations/:id/attendance` | ENTRENADOR asignado | Registrar asistencia |
| PATCH | `/api/class-sessions/:id/complete` | ENTRENADOR asignado | Completar sesión |

La lógica del módulo contempla la disponibilidad de cupos, el estado de las reservas y las condiciones para registrar asistencia.

### 5.4. Módulo 3: Sesiones personales

Permite organizar la disponibilidad de entrenadores y gestionar las reservas individuales.

| Método | Endpoint de la especificación | Rol | Función |
|---|---|---|---|
| GET | `/api/trainer-slots/me` | ENTRENADOR | Consultar disponibilidad |
| POST | `/api/trainer-slots` | ENTRENADOR | Crear horario |
| PATCH | `/api/trainer-slots/:id` | ENTRENADOR | Editar horario |
| DELETE | `/api/trainer-slots/:id` | ENTRENADOR | Eliminar horario |
| GET | `/api/trainers` | MIEMBRO | Consultar entrenadores |
| GET | `/api/trainers/:trainerId/slots` | MIEMBRO | Consultar horarios libres |
| POST | `/api/personal-sessions` | MIEMBRO | Agendar sesión |
| GET | `/api/personal-sessions/me` | MIEMBRO | Consultar sesiones propias |
| PATCH | `/api/personal-sessions/:id/cancel` | MIEMBRO | Cancelar sesión |
| GET | `/api/trainers/me/agenda` | ENTRENADOR | Consultar agenda |
| PATCH | `/api/personal-sessions/:id/attendance` | ENTRENADOR | Registrar asistencia |

Las reservas deben respetar la disponibilidad del entrenador y las condiciones establecidas para evitar conflictos de horario.

### 5.5. Módulo 4: Control de ingresos

Este módulo permite consultar miembros y registrar sus ingresos al gimnasio.

| Método | Endpoint de la especificación | Rol | Función |
|---|---|---|---|
| GET | `/api/access/members` | RECEPCION_ADMIN | Buscar miembros |
| POST | `/api/access/check-ins` | RECEPCION_ADMIN | Registrar ingreso |


### 5.6. Módulo 5: Pagos y comprobantes

Este módulo contempla las operaciones relacionadas con los cobros y pagos de los miembros.

**Funcionalidades contempladas:**

- Consulta de cobros.
- Registro y confirmación de pagos.
- Procesamiento de pagos simulados.
- Consulta de historial de pagos.
- Descarga de comprobantes.
- Consulta de pagos pendientes.
- Anulación de cobros.

| Método | Endpoint de la especificación | Función |
|---|---|---|
| GET | `/api/receipts/:id/pdf` | Descargar comprobante PDF |


### 5.7. Módulo 6: Rutinas y progreso físico

Este módulo permite gestionar rutinas de entrenamiento y registrar información del progreso físico.

| Método | Endpoint de la especificación | Rol | Función |
|---|---|---|---|
| GET | `/api/exercises` | MIEMBRO / ENTRENADOR | Consultar ejercicios |
| GET | `/api/training-routines/me` | MIEMBRO | Consultar rutinas |
| GET | `/api/training-routines/:id` | MIEMBRO | Consultar detalle |
| POST | `/api/training-routines` | ENTRENADOR | Asignar rutina |
| GET | `/api/progress-records/me` | MIEMBRO | Consultar progreso |
| POST | `/api/progress-records` | MIEMBRO | Registrar progreso |
| PATCH | `/api/progress-records/:id` | MIEMBRO | Actualizar progreso |
| GET | `/api/progress-records/me/evolution` | MIEMBRO | Consultar evolución |
| GET | `/api/trainers/me/members` | ENTRENADOR | Consultar miembros asignados |

### 5.8. Módulo 7: Máquinas y mantenimiento

Este módulo contempla:

- Consulta del catálogo de máquinas.
- Consulta de disponibilidad.
- Administración del estado de las máquinas.
- Registro de mantenimientos.
- Cierre de mantenimientos.
- Consulta de historial de cambios.

### 5.9. Módulo 8: Evaluaciones

Este módulo contempla el registro y consulta de evaluaciones de sesiones de entrenamiento.

Incluye operaciones relacionadas con las calificaciones y la consulta de resultados.


### 5.10. Módulo 9: Notificaciones

Administra notificaciones relacionadas con las operaciones del gimnasio, como reservas, pagos y vencimientos.

**Operaciones contempladas:**

- Consultar notificaciones.
- Consultar notificaciones no leídas.
- Marcar notificaciones como leídas.

### 5.11. Módulo 10: Reportes

Este módulo contempla la consulta de información estadística y administrativa.

Los reportes permiten apoyar el seguimiento de las actividades del gimnasio.


## 6. Manejo de errores

El backend utiliza respuestas HTTP para informar el resultado de las solicitudes.

El frontend debe interpretar dichas respuestas y mostrar mensajes comprensibles.

Entre los escenarios contemplados se encuentran:

- **401:** solicitar autenticación cuando no exista una sesión válida.
- **403:** informar que el usuario no tiene permisos para realizar la operación.
- **400:** mostrar los problemas encontrados en los datos ingresados.
- **404:** informar cuando no se encuentre el recurso solicitado.
- **409:** comunicar los conflictos relacionados con las reglas de negocio.
- **500:** mostrar un mensaje general sin exponer información interna del servidor.


## 7. Seguridad de la API

La API contempla los siguientes mecanismos de seguridad:

- Autenticación para operaciones protegidas.
- Autorización basada en roles.
- Validación de los datos recibidos.
- Restricción de acceso a información personal.
- Gestión de tokens JWT.
- Uso de bcrypt para el almacenamiento seguro de contraseñas.
- Configuración de secretos mediante variables de entorno.
- Comunicación HTTPS en producción.
- Configuración de CORS para los orígenes autorizados.


## 8. Configuración del backend en producción

**Plataforma:** Render

**Base de datos:** PostgreSQL alojado en Render

Las variables de entorno del backend incluyen:

| Variable | Función |
|---|---|
| `NODE_ENV` | Entorno de ejecución |
| `PORT` | Puerto del servidor |
| `DATABASE_URL` | Conexión a PostgreSQL |
| `JWT_SECRET` | Firma de tokens JWT |
| `JWT_EXPIRES_IN` | Expiración del token de acceso |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Vigencia del token de renovación |
| `BCRYPT_SALT_ROUNDS` | Rondas de hashing |
| `CORS_ORIGINS` | Orígenes permitidos |
| `ALLOW_DEMO_SEED` | Configuración de datos de demostración |


## 9. Pruebas de la API

Las verificaciones deben incluir:

1. Solicitudes con datos válidos.
2. Solicitudes con datos inválidos.
3. Acceso sin autenticación.
4. Acceso con roles no autorizados.
5. Validación de las reglas de negocio.
6. Respuestas HTTP esperadas.
7. Persistencia de la información cuando corresponda.
8. Integración con el frontend desplegado.

