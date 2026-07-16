# Rendimiento Estudiantil Analytics BI

Aplicación web académica desarrollada con **Next.js 16**, **React 19**, **Prisma**, **PostgreSQL en Neon** y **Recharts**. El sistema permite registrar usuarios, aprobar solicitudes, consultar indicadores de rendimiento académico, filtrar muestras y realizar simulaciones de nota.

## Cambios incluidos en esta versión

- Validación de correo en el navegador y en el servidor.
- Normalización de correos a minúsculas para evitar duplicados.
- Validación de nombre, contraseña, rol e ID de estudiante.
- Contraseñas nuevas almacenadas con hash `bcrypt`.
- Migración automática de contraseñas antiguas en texto plano al iniciar sesión.
- Cookies de sesión firmadas mediante `SESSION_SECRET`.
- Filtros del dashboard aplicados únicamente al pulsar **Aplicar filtros y analizar**.
- Cancelación de consultas anteriores para evitar respuestas fuera de orden.
- Restricción para impedir que el valor mínimo supere al máximo.
- Validación de filtros también en la API.
- Descripción del sistema en la parte inferior de las interfaces.

## Requisitos

- Node.js 20.9 o superior. Se recomienda Node.js 22.
- npm.
- Una base PostgreSQL en Neon.

No es necesario instalar Next.js de forma global. `npm install` instala todas las dependencias del proyecto.

## Configuración local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el archivo de variables de entorno

En Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

En CMD:

```cmd
copy .env.example .env.local
```

Edite `.env.local` y coloque los valores reales:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASENA@HOST/BASE_DE_DATOS?sslmode=require"
SESSION_SECRET="UNA_CLAVE_ALEATORIA_LARGA"
```

Puede generar `SESSION_SECRET` con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Nunca suba `.env.local` ni la contraseña de Neon a GitHub.

### 3. Generar Prisma

```bash
npx prisma generate
```

Si está conectándose a una base nueva y vacía:

```bash
npx prisma db push
```

Si la base de Neon ya contiene las tablas del proyecto, no necesita ejecutar `db push`.

### 4. Crear o actualizar el administrador

El comando usa por defecto:

- Correo: `admin@bi.com`
- Contraseña: `admin123`

```bash
npm run admin:create
```

Para definir otras credenciales, agregue temporalmente a `.env.local`:

```env
ADMIN_EMAIL="administrador@dominio.com"
ADMIN_PASSWORD="UnaClaveSegura"
```

Luego vuelva a ejecutar:

```bash
npm run admin:create
```

### 5. Ejecutar el proyecto

```bash
npm run dev
```

Abra en el navegador:

```text
http://localhost:3000
```

## Importar estudiantes

Si la tabla `students` está vacía y desea importar el archivo CSV incluido:

```bash
npm run students:import
```

Antes de importar, verifique que `DATABASE_URL` apunte a la base correcta.

## Despliegue o actualización en Vercel

### Método recomendado: GitHub conectado a Vercel

1. Suba esta carpeta a un repositorio de GitHub. No incluya `.env.local` ni `node_modules`.
2. En Vercel, seleccione **Add New → Project** e importe el repositorio.
3. Vercel detectará automáticamente el framework **Next.js**.
4. En **Settings → Environment Variables**, agregue:
   - `DATABASE_URL`: cadena de conexión de Neon.
   - `SESSION_SECRET`: cadena aleatoria larga.
5. Active las variables para **Production**, **Preview** y **Development**, según lo que necesite.
6. Pulse **Deploy**.
7. Cuando el despliegue termine, Vercel entregará una dirección terminada en `.vercel.app` que puede compartir.

Si Neon está conectado mediante Vercel Marketplace, las credenciales de la base pueden añadirse automáticamente. Confirme que el proyecto tenga una variable llamada exactamente `DATABASE_URL`, porque ese es el nombre que usa el código.

### Actualizar un proyecto que ya está desplegado

Si el proyecto de Vercel ya está vinculado al repositorio:

```bash
git add .
git commit -m "Corrige validaciones y estabilidad del dashboard"
git push
```

Cada `push` a la rama de producción genera un despliegue nuevo automáticamente.

Si cambió una variable de entorno, debe crear un despliegue nuevo. En Vercel abra **Deployments**, seleccione el último despliegue, abra el menú de tres puntos y elija **Redeploy**.

## Errores frecuentes

### `DATABASE_URL` no está configurada

Compruebe que exista en `.env.local` para desarrollo y en **Environment Variables** para Vercel.

### `SESSION_SECRET no está configurado`

Genere una clave aleatoria y agréguela en Vercel. No use el texto de ejemplo en producción.

### La página carga, pero no aparecen datos

- Verifique la conexión de Neon.
- Confirme que la tabla `students` tenga registros.
- Revise los logs del despliegue en Vercel.
- Inicie sesión como `ADMIN` o `PROFESOR`, porque la API analítica está protegida.

### Los cambios de variables no aparecen

Las variables nuevas no se aplican a despliegues anteriores. Ejecute un despliegue nuevo o use **Redeploy**.
