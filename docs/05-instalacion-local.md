# Instalación local

### Tecnologías del proyecto

| Componente | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | NestJS 12, TypeScript |
| Base de datos | PostgreSQL 18 |
| ORM | Prisma 7 |
| Pruebas backend | Vitest |

## Pasos

### 1. Clonar los repositorios

El proyecto utiliza dos repositorios independientes.

Frontend:

```bash
git clone https://github.com/katherineoliva274/fe_boilerplate_is_2026.git
```

Backend:

```bash
git clone https://github.com/Michelljk/be_boilerplate_is_2026.git
```

### 2. Configurar el backend

Entrar al directorio del backend:

```bash
cd be_boilerplate_is_2026
```

Copiar el archivo de configuración:

```powershell
Copy-Item .env.example .env
```

Para ejecutar el backend localmente junto al frontend en sus puertos predeterminados, se puede configurar:

```dotenv
PORT=8000
```

La base de datos debe estar configurada mediante `DATABASE_URL`.

### 3. Iniciar PostgreSQL

Desde la carpeta del backend:

```bash
docker compose up -d postgres
```

Este comando inicia PostgreSQL utilizando el servicio definido en `docker-compose.yml`.

### 4. Instalar dependencias del backend

```bash
npm install
```

Se puede generar manualmente:

```bash
npm run prisma:generate
```

### 5. Preparar la base de datos

Aplicar las migraciones de desarrollo:

```bash
npm run prisma:migrate
```

Cargar los datos semilla:

```bash
npm run db:seed
```

El script de datos semilla está configurado en:

`prisma/seed.ts`


### 6. Iniciar el backend

```bash
npm run start:dev
```

Con `PORT=8000`, la API se ejecuta en el puerto 8000.

La documentación Swagger está configurada en la ruta `/api/docs`, por lo que se espera acceder a:

`http://localhost:8000/api/docs`

La dirección debe comprobarse al iniciar el servidor.

### 7. Configurar el frontend

En otra terminal, ingresar a la carpeta del frontend:

```bash
cd fe_boilerplate_is_2026
```

Instalar las dependencias:

```bash
npm install
```

Crear el archivo local de variables a partir de `.env.example`:

```powershell
Copy-Item .env.example .env.local
```

Configurar la dirección del backend:

```dotenv
API_URL=http://localhost:8000
```

### 8. Iniciar el frontend

Ejecutar:

```bash
npm run dev
```

Abrir la aplicación en el navegador:

`http://localhost:3000`

El frontend debe comunicarse con el backend mediante la URL configurada.

## Ejecución alternativa con Docker Compose

Para levantar el backend y PostgreSQL mediante Docker:

```bash
docker compose up --build
```

El archivo `docker-compose.yml` incluye los servicios `api` y `postgres`.


Para cargar los datos semilla dentro del contenedor:

```bash
docker compose exec api npx prisma db seed
```

## Variables de entorno

### Backend

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto de la API | `8000` |
| `POSTGRES_USER` | Usuario de PostgreSQL | Valor local |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | Valor privado |
| `POSTGRES_DB` | Base de datos | `si_be_boilerplate` |
| `POSTGRES_PORT` | Puerto PostgreSQL | `5432` |
| `DATABASE_URL` | Cadena de conexión PostgreSQL | Configuración local |
| `JWT_SECRET` | Secreto para firmar JWT | Valor privado de al menos 32 caracteres |
| `JWT_EXPIRES_IN` | Duración del token | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Vigencia del refresh token | `7` |
| `BCRYPT_SALT_ROUNDS` | Costo del hash de contraseñas | `12` |

### Frontend

| Variable | Descripción | Ejemplo |
|---|---|---|
| `API_URL` | Dirección base del backend | `http://localhost:8000` |


## Pruebas automatizadas

### Backend

Las pruebas utilizan Vitest.

Ejecutar todas las pruebas:

```bash
npm test
```

Ejecutar pruebas con cobertura:

```bash
npm run test:cov
```

Ejecutar pruebas end-to-end:

```bash
npm run test:e2e
```

### Frontend

El frontend tiene disponibles los siguientes comandos:

Verificar el código:

```bash
npm run lint
```

Comprobar la compilación:

```bash
npm run build
```

## Verificación del sistema

Después de iniciar los servicios, comprobar:

1. El frontend carga en el navegador.
2. El backend responde correctamente.
3. Swagger está accesible.
4. PostgreSQL está conectado.
5. Los usuarios de prueba pueden iniciar sesión.
6. Las rutas protegidas respetan los roles.
7. Los módulos implementados muestran y almacenan información correctamente.
