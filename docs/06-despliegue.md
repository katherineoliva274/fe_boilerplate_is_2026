# 06. Despliegue del Sistema de Gestión de Gimnasio GKDS

## 1. Descripción general

El Sistema de Gestión de Gimnasio GKDS es una aplicación web desarrollada mediante una arquitectura que separa el frontend, el backend y la base de datos.

El frontend fue desarrollado con **Next.js**, el backend utiliza **NestJS** y la persistencia de datos se realiza mediante **PostgreSQL**.

La comunicación entre los servicios se realiza mediante HTTPS.

## 2. Dónde está desplegado

| Componente | Plataforma | URL | Rama |
|---|---|---|---|
| Frontend | Vercel | https://fe-boilerplate-is-2026.vercel.app | `main` |
| Backend | Render | https://be-boilerplate-is-2026-dqyw.onrender.com | `main` |
| Base de datos PostgreSQL | Render  

### Repositorios del proyecto

**Frontend:**

https://github.com/katherineoliva274/fe_boilerplate_is_2026

**Backend:**

https://github.com/Michelljk/be_boilerplate_is_2026

### Documentación de la API

El backend utiliza Swagger para documentar sus endpoints REST.

**URL prevista:**

https://be-boilerplate-is-2026-dqyw.onrender.com/api/docs


## 3. Arquitectura de despliegue

El sistema está distribuido en tres componentes principales:

**Frontend — Vercel**

Presenta la interfaz de usuario y permite acceder a los módulos de administración, recepción, entrenadores y miembros.

**Backend — Render**

Procesa las solicitudes de la aplicación, ejecuta las reglas de negocio, gestiona la autenticación y se comunica con la base de datos.

**Base de datos — PostgreSQL en Render**

Almacena la información relacionada con usuarios, membresías, pagos, reservas, clases y demás operaciones del gimnasio.

### Flujo de comunicación

1. El usuario accede a la aplicación mediante la URL pública de Vercel.
2. El frontend realiza las solicitudes necesarias al backend.
3. El backend procesa las operaciones y valida los permisos correspondientes.
4. Cuando es necesario, el backend consulta o modifica los datos almacenados en PostgreSQL.
5. El backend devuelve una respuesta al frontend.
6. El frontend presenta la información o el resultado de la operación al usuario.

## 4. Cómo se publica una nueva versión

El equipo utiliza un flujo de trabajo basado en Git Flow para organizar el desarrollo y la publicación.

### 4.1. Desarrollo e integración

1. Cada funcionalidad se desarrolla en su rama correspondiente.
2. Se crea un Pull Request hacia `develop`.
3. Los cambios son revisados y posteriormente integrados.
4. Una vez consolidada la versión, se prepara una rama `release/1.0.0`.

### 4.2. Publicación del frontend

Para preparar la versión 1.0.0 se siguió el siguiente procedimiento:

1. Se actualizaron los cambios integrados en `develop`.
2. Se creó la rama `release/1.0.0`.
3. Se publicó la rama en GitHub.
4. Se creó el Pull Request **#41** hacia `main`.
5. El Pull Request fue revisado y aprobado por otro integrante del equipo.
6. Se fusionaron los cambios hacia `main`.
7. Se importó el repositorio en Vercel.
8. Se configuró la variable de entorno para la comunicación con el backend.
9. Se realizó el despliegue de producción.
10. Se verificó que Vercel mostrara el estado **Ready**.


### 4.3. Publicación del backend

El backend se encuentra alojado en Render y su código fuente se administra en un repositorio independiente.

El despliegue se realizó utilizando la versión integrada en `main`.


## 5. Variables de entorno en producción

Las variables de entorno permiten configurar los servicios sin incluir valores sensibles directamente en los archivos del repositorio.

### 5.1. Variables del frontend — Vercel

| Variable | Descripción |
|---|---|
| `API_URL` | Dirección pública del backend consumida por el frontend |


### 5.2. Variables del backend — Render

| Variable | Descripción |
|---|---|
| `NODE_ENV` | Define el entorno de ejecución |
| `PORT` | Puerto en el que se ejecuta el servidor |
| `DATABASE_URL` | Cadena de conexión privada a PostgreSQL |
| `JWT_SECRET` | Clave secreta utilizada para firmar tokens JWT |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token de acceso |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Vigencia del token de renovación |
| `BCRYPT_SALT_ROUNDS` | Número de rondas utilizadas para el hashing de contraseñas |
| `CORS_ORIGINS` | Lista de orígenes permitidos para realizar solicitudes al backend |
| `ALLOW_DEMO_SEED` | Controla si se permite la carga de datos semilla de demostración |

## 6. Configuración de CORS

El backend utiliza la variable `CORS_ORIGINS` para establecer qué orígenes pueden realizar solicitudes desde el navegador.

El dominio público de producción del frontend es:

`https://fe-boilerplate-is-2026.vercel.app`

## 7. Conexión con la base de datos

La base de datos del sistema utiliza PostgreSQL alojado en Render.

El backend se conecta a la base mediante la variable `DATABASE_URL`, configurada con la dirección interna de conexión proporcionada por Render.

La base de datos no se expone directamente al frontend. Todas las operaciones se realizan a través de los servicios del backend.

La estructura de las entidades y sus relaciones se gestiona mediante Prisma.

## 8. Verificación del despliegue

Después de publicar una versión se debe comprobar el funcionamiento de los componentes.

### 8.1. Frontend

- Verificar que el dominio público sea accesible mediante HTTPS.
- Confirmar que Vercel muestre el estado `Ready`.
- Comprobar que la pantalla de inicio de sesión cargue correctamente.
- Verificar la navegación entre las vistas correspondientes a cada rol.

### 8.2. Backend

- Confirmar que el servicio de Render esté disponible.
- Verificar el acceso a Swagger.
- Probar los endpoints de autenticación.
- Comprobar la conexión con PostgreSQL.
- Revisar las respuestas y los códigos de error de la API.

### 8.3. Integración

- Iniciar sesión desde el frontend desplegado.
- Verificar que las solicitudes lleguen correctamente al backend.
- Comprobar la autenticación y la autorización según los roles.
- Validar las principales operaciones de cada módulo.
- Confirmar que no aparezcan errores de CORS.
- Registrar los fallos encontrados y sus evidencias.
