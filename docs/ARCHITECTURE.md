# Arquitectura · Código de Fases 1A–5

## Árbol del repositorio

```text
.
├── hackaton-backend/           # @club/api
│   ├── prisma/                # schema, migraciones y datos mock sintéticos
│   ├── src/
│   │   ├── modules/           # auth, users, companies, stores, customers, points,
│   │   │                      # products, redeemable-products, redemptions, dice,
│   │   │                      # zones, settings, dashboard, uploads, audit
│   │   ├── shared/            # db, config, errores, tiempo, integraciones y permisos
│   │   ├── app.ts             # composición de la API con dependencias inyectables
│   │   ├── routes.ts          # composición de todos los módulos /api
│   │   └── server.ts          # arranque y validación de entorno
│   └── test/                  # integration, helpers y setup
├── hackaton-form-frontend/    # @club/customer-web: páginas públicas y proxy /api
├── hackaton-dash-frontend/    # @club/admin-web: layout, features y proxy /api
├── packages/contracts/       # @club/contracts: zod y tipos compartidos
├── docs/                     # arquitectura, reglas, decisiones, avance y API
├── docker-compose.yml        # PostgreSQL local únicamente
├── docker-compose.prod.yml   # nginx, API, migración y PostgreSQL en EC2
├── docker/nginx/              # compilación estática y proxy /api
├── .github/workflows/        # CI con PostgreSQL aislado y despliegue manual
├── package.json              # comandos del workspace
└── pnpm-workspace.yaml
```

## Responsabilidades

Cada módulo del backend posee un dominio. Routers declaran rutas, validación y RBAC; services aplican reglas, ABAC y Prisma; DTOs definen entradas. Los servicios de acciones auditadas pasan el mismo cliente de transacción a `audit.log`.

El flujo es router → middlewares → service → Prisma/audit. `redemptions` bloquea el cliente y delega toda escritura de lotes a `points/consume.service.ts`. `dice` confía en la unicidad de la base para la tirada única. La ruta `/api/health` consulta Prisma; la disponibilidad real depende de PostgreSQL.

`shared/` contiene infraestructura transversal y las reglas de acceso. `packages/contracts` publica su TypeScript de origen; Vite lo compila y `tsup` lo incluye en el bundle del API. El formulario elige su página según `window.location.pathname`. El panel usa React Router (base `/admin`), TanStack Query, un proveedor de sesión y guards. Access/refresh viajan solo en cookies HTTP-only; el frontend conserva únicamente el perfil seguro.

## Límites

No hay pagos en línea, endpoint para sumar puntos, jobs de vencimiento, Redis, tercer frontend ni otro ORM. El factor de puntos visual nunca toca la contabilidad. Datos base y mocks se cargan con `seed.ts` y `prisma/mock/load-*.ts`, no desde pantallas. Las imágenes viven en S3; PostgreSQL guarda únicamente `imageKey`. El panel sirve React estático en `/admin`, el formulario en `/`, y nginx reenvía `/api` a Express. No se ha desplegado el código de Fases 1B–5 en AWS.

Las pantallas y rutas de base de datos todavía requieren pruebas de integración sobre `club_test`. Las credenciales externas se inyectan por entorno y no se han probado manualmente. Antes de producción, además de dichas pruebas, se debe resolver el cifrado CloudFront→origen descrito en `agents/STACK.md`.
