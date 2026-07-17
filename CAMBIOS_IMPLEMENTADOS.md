# Cambios implementados

## 1. Restricción de dominios de correo

El registro público acepta únicamente correos terminados en:

- `@gmail.com`
- `@outlook.com`
- `@hotmail.com`

La validación se realiza en dos niveles:

1. En el formulario del navegador, para informar inmediatamente al usuario.
2. En la API `/api/auth/register`, para impedir que la restricción pueda omitirse enviando una petición manual.

Los correos se normalizan a minúsculas y sin espacios antes de validarse y almacenarse.

## 2. Administración de cuentas

Se agregó la pestaña **Administrar Cuentas** a la interfaz del administrador. Esta sección permite:

- Listar las cuentas registradas de profesores y estudiantes.
- Consultar nombre, correo, rol, ID de estudiante, estado y fecha de registro.
- Eliminar una cuenta después de una confirmación explícita.

La ruta `/api/admin/accounts` comprueba que la sesión pertenezca a un administrador. También bloquea la eliminación de cuentas administrativas.

## 3. Base de datos

No se requiere una migración nueva de Prisma, porque la funcionalidad utiliza el modelo `User` que ya existe en `prisma/schema.prisma`.

## 4. Comprobación rápida

1. Ejecute `npm install`.
2. Configure `.env.local`.
3. Ejecute `npx prisma generate`.
4. Ejecute `npm run dev`.
5. Pruebe el registro con un correo permitido y otro dominio, como Yahoo.
6. Inicie sesión como administrador y abra **Administrar Cuentas**.
