# EnlaceHermano

Programa de fidelización de Farmaenlace: API Express/Prisma, formulario público y panel interno React/Vite. El código de las fases 1A–5 está en `main`; la EC2 todavía sirve placeholders, no esta aplicación.

## Requisitos

- Node.js 20 o posterior y pnpm.
- Docker Compose para PostgreSQL local.

## Inicio

1. Copia `.env.example` a `.env` en la raíz y en `hackaton-backend/`. Completa las variables con valores de desarrollo propios. Los frontends no necesitan `.env` para funcionar. Nunca subas esos archivos.
2. Ejecuta `pnpm install`.
3. Ejecuta `pnpm db:up`. Crea además la base de pruebas con `docker compose exec postgres psql -U club -d postgres -c 'CREATE DATABASE club_test'` (ajusta el usuario si cambiaste `POSTGRES_USER`). Si ya existe, omite este paso.
4. Con el schema de Prisma en `hackaton-backend/prisma/schema.prisma`, ejecuta `pnpm db:migrate`.
5. Ejecuta `pnpm dev`.

Para el seed sintético, define `SEED_ADMIN_PASSWORD` y `SEED_ADVISOR_PASSWORD` (mínimo 12 caracteres, solo en tu `.env` local) y ejecuta `pnpm db:seed`. Después carga los datos mock de cada módulo con `pnpm db:mock:customers`, `pnpm db:mock:redeemables`, `pnpm db:mock:prizes` y `pnpm db:mock:sales`. Los formatos JSON/CSV están en `hackaton-backend/prisma/mock/README.md`. No ejecutes los loaders en producción.

Para ejecutar también la prueba de integración HTTP, configura `DATABASE_URL` con la base `club_test`, pon `RUN_DB_TESTS=1` y ejecuta `pnpm test`. El test comprueba el nombre de la base antes de comenzar.

La API escucha en `http://localhost:3000/api`, el formulario en `http://localhost:5173` y el panel en `http://localhost:5174/admin/`. Ambos frontends consultan `/api/*` mediante el proxy local de Vite. El panel contiene clientes, canjes, dados, catálogo, zonas, usuarios, dashboard y auditoría.

El schema de Prisma está en `hackaton-backend/prisma/schema.prisma`. Para migración, seed y pruebas de integración hace falta PostgreSQL en un entorno privado; no se han ejecutado aquí por decisión del usuario. `pnpm -r typecheck`, `pnpm lint`, `pnpm test`, `pnpm knip`, `pnpm format:check` y `pnpm build` verifican el código sin usar AWS. Consulta `docs/PROGRESS.md` para resultados y pendientes.

El stack de producción y la validación AWS están en `docs/DEPLOYMENT.md`. El workflow de despliegue es manual y no debe ejecutarse hasta completar sus prerrequisitos.

## Credenciales de prueba

Datos sintéticos del hackatón (`pnpm db:seed:all`), iguales en local y producción:

| Rol           | Correo                   | Contraseña   |
| ------------- | ------------------------ | ------------ |
| Administrador | `admin@farmaenlace.com`  | `Admin123!`  |
| Asesor        | `asesor@farmaenlace.com` | `Asesor123!` |
