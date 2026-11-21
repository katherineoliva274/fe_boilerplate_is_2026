# Sistema de Gestión de Gimnasio – GKDS

**Universidad:** Universidad Centroamericana José Simeón Cañas (UCA)  
**Asignatura:** Ingeniería de Software  
**Ciclo:** 02/2026  
**Proyecto:** 2 – Plataforma de gestión de gimnasio / centro de entrenamiento  
**Equipo:** GKDS  
**Versión:** 1.0.0

## 1. Descripción del proyecto

El Sistema de Gestión de Gimnasio GKDS es una aplicación web desarrollada para facilitar la administración de las actividades de un centro de entrenamiento.

La plataforma contempla la gestión de membresías, planes, clases grupales, reservas, entrenadores, sesiones personales, pagos, control de ingresos, máquinas, rutinas, progreso físico y notificaciones.

El sistema organiza sus funcionalidades mediante roles, permitiendo que cada usuario acceda a las operaciones correspondientes a sus permisos.

La aplicación está desplegada en la nube y utiliza una arquitectura con frontend, backend y base de datos independientes.

## 2. Integrantes del equipo

| Integrante | Responsabilidad |
|---|---|
| Katherine Guadalupe Oliva Aguilar | Desarrollo de historias de usuario asignadas, frontend |
| Gabriel Antonio Urquilla Zetino | Desarrollo de historias de usuario asignada, backend |
| Samael Atlacatl Montes Grande | Desarrollo de historias de usuario asignadas, frontend |
| Diana Michell Velasquez Melendez | Desarrollo de historias de usuario asignadas, backend |

El desarrollo se organiza mediante historias de usuario, ramas de trabajo y solicitudes de integración (Pull Requests).

## 3. Tecnologías utilizadas

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- NestJS
- TypeScript
- Prisma ORM
- Autenticación JWT

### Base de datos

- PostgreSQL

### Herramientas y servicios

- Git y GitHub para control de versiones.
- Jira para seguimiento de historias de usuario.
- Docker para ejecución local según la configuración del proyecto.
- Swagger para documentación de la API.
- Vercel para despliegue del frontend.
- Render para despliegue del backend y alojamiento de PostgreSQL.

## 4. Roles del sistema

El sistema contempla tres roles principales.

**MIEMBRO:** consulta su membresía, realiza reservas, consulta rutinas, registra su progreso y accede a sus pagos y notificaciones.

**ENTRENADOR:** administra su disponibilidad, consulta sesiones asignadas y registra las actividades de entrenamiento correspondientes.

**RECEPCION_ADMIN:** administra planes, solicitudes de membresía, cobros, ingresos, máquinas y otras operaciones administrativas.

## 5. Funcionalidades principales

- Gestión de membresías y planes.
- Consulta y reserva de clases grupales.
- Administración de horarios de entrenadores.
- Reserva de sesiones personales.
- Control de ingresos de miembros.
- Gestión de pagos y comprobantes.
- Consulta y seguimiento de rutinas.
- Registro de progreso físico.
- Administración de máquinas y mantenimientos.
- Notificaciones relacionadas con las actividades del gimnasio.
- Consultas y reportes administrativos.

## 6. Enlaces del proyecto

| Recurso | Enlace |
|---|---|
| Frontend desplegado | https://fe-boilerplate-is-2026.vercel.app |
| Backend desplegado | https://be-boilerplate-is-2026-dqyw.onrender.com |
| Swagger de la API | https://be-boilerplate-is-2026-dqyw.onrender.com/api/docs |
| Repositorio frontend | https://github.com/katherineoliva274/fe_boilerplate_is_2026 |
| Repositorio backend | https://github.com/Michelljk/be_boilerplate_is_2026 |
| Tablero Jira | https://katherineoliva274.atlassian.net/jira/software/projects/GKDS/boards/3/backlog |

## 7. Acceso y usuarios de prueba

El Sistema de Gestión de Gimnasio GKDS cuenta con tres roles principales para acceder a las diferentes funcionalidades.

**URL del sistema:** https://fe-boilerplate-is-2026.vercel.app

### Credenciales de prueba

| Rol | Correo electrónico | Contraseña |
|---|---|---|
| RECEPCION_ADMIN (Administrador) | admin@gkds.test | Prueba123 |
| ENTRENADOR | entrenador1@gkds.test | Prueba123 |
| MIEMBRO | miembro1@gkds.test | Prueba123 |

### Cómo acceder

1. Abrir la URL pública del sistema.
2. Introducir el correo electrónico correspondiente al rol que se desea probar.
3. Escribir la contraseña de prueba.
4. Presionar **Iniciar sesión**.
5. Acceder a las funcionalidades disponibles según los permisos del usuario.

### Funcionalidades por rol

**RECEPCION_ADMIN:** administración de membresías, planes, cobros, control de ingresos, máquinas y reportes.

**ENTRENADOR:** consulta de agenda, administración de disponibilidad, sesiones y rutinas de entrenamiento.

**MIEMBRO:** consulta de membresía, reservas, pagos, rutinas, progreso físico y notificaciones.


## 8. Ejecución local del frontend

### Requisitos

- Node.js y npm compatibles con el proyecto.
- Acceso a la API del backend.
- Archivo de configuración local con las variables necesarias.

### Instalación

Clonar el repositorio:

```bash
git clone https://github.com/katherineoliva274/fe_boilerplate_is_2026.git
```

Ingresar a la carpeta del proyecto:

```bash
cd fe_boilerplate_is_2026
```

Instalar dependencias:

```bash
npm install
```

Configurar las variables de entorno utilizando `.env.example` como referencia.

La variable `API_URL` identifica la dirección del backend que utilizará el frontend.

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abrir la aplicación local:

http://localhost:3000

Para obtener instrucciones adicionales, consultar [05. Instalación local](docs/05-instalacion-local.md).

## 9. Arquitectura general

El sistema utiliza una arquitectura que separa la presentación, la lógica de negocio y la persistencia.

**Frontend:** desarrollado en Next.js y desplegado en Vercel.

**Backend:** implementado con NestJS, expone servicios REST, gestiona la autenticación y aplica las reglas de negocio.

**Base de datos:** PostgreSQL alojado en Render, administrado desde el backend mediante Prisma ORM.

El frontend se comunica con el backend por HTTPS. El backend accede a PostgreSQL utilizando una conexión privada.


## Despliegue en producción

### Frontend

**Plataforma:** Vercel  
**Rama de producción:** `main`  
**URL:** https://fe-boilerplate-is-2026.vercel.app

### Backend

**Plataforma:** Render  
**Rama de publicación:** `main`  
**URL:** https://be-boilerplate-is-2026-dqyw.onrender.com

### Base de datos

**Motor:** PostgreSQL  
**Plataforma:** Render

El backend utiliza variables de entorno para administrar la conexión a PostgreSQL, los parámetros JWT, los orígenes CORS permitidos y otros valores de configuración.

La versión inicial del frontend fue integrada en `main` y desplegada en Vercel. El backend fue publicado en Render y utiliza PostgreSQL alojado en la misma plataforma.
