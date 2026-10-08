# Progreso

## 2026-10-08 · Fase 1A

- Workspace pnpm, API Express, contratos compartidos, frontends Vite y configuración local creados.
- Schema aportado por el usuario incorporado con relación asesor–tienda e índices de claves foráneas.
- Estructura de módulos creada sin lógica de negocio.
- `pnpm install --offline` finalizó sin errores después de autorizar los scripts de Prisma y esbuild. El primer intento detectó esa configuración faltante.
- `prisma validate` y `prisma generate` pasaron; se generó `prisma/migrations/20261008000000_init/migration.sql` desde el schema.
- `pnpm -r typecheck`, `pnpm lint`, `pnpm knip` y `pnpm build` pasaron.
- `pnpm format:check` pasó. El lockfile se excluye porque su formato pertenece a pnpm.
- El lockfile también pasó la validación sin descarga de `corepack pnpm` 10.0.0.
- `pnpm test`: 6 pruebas pasaron; 1 prueba de integración quedó omitida porque requiere PostgreSQL real.
- `pnpm dev` arrancó las tres apps. Los dos frontends respondieron HTTP 200 y sus proxies alcanzaron la API. `/health` devolvió HTTP 500 porque no hay PostgreSQL en este equipo.
- La prueba de arranque sin `JWT_ACCESS_SECRET` terminó con `Configuración inválida: JWT_ACCESS_SECRET: Required` (exit 1). El `.env` local se restauró.
- `pnpm db:up` falló: `docker` no está instalado. `pnpm db:migrate` no pudo aplicar la migración sin una base en `localhost:5432`.
- Pendiente para cerrar 1A: instalar o habilitar Docker/PostgreSQL, crear `club_test`, aplicar la migración y ejecutar la prueba de integración con `RUN_DB_TESTS=1`.

## 2026-10-08 · AWS

- La conexión de solo lectura a S3 y `sts get-caller-identity` funcionó con credenciales temporales guardadas en `hackaton-backend/.env` (ignorado por Git).
- La cuenta no tenía EC2, RDS, buckets ni distribuciones CloudFront. Se reutilizaron el SG `hackaton-api-sg` (entrada 80 solo desde el prefix list de CloudFront) y el perfil `HackatonEc2SsmProfile`.
- Se lanzó la única EC2 `t3.medium` del proyecto: `i-092c3e48e393d4b3c`, Amazon Linux 2023, EBS cifrado y acceso SSM. Está en estado `running` y SSM `Online`.
- El usuario confirmó Node/Express y la EC2 existente con Amazon Linux 2023; el despliegue quedó suspendido por su solicitud posterior de realizar antes el PROMPT 2.

## 2026-10-08 · Fase 1B (implementación local, sin AWS)

- El usuario pidió detener toda acción en AWS y ejecutar una sola fase del PROMPT 2; se tomó la primera, 1B. No se instaló ni desplegó nada en la EC2 durante esta fase.
- Se implementaron login/logout/refresh/me/cambio de contraseña, cookies HTTP-only, verificación de usuario activo, cambio obligatorio, RBAC/ABAC, cabecera CSRF y límites de login.
- `audit.log(tx, entry)` registra login correcto/fallido y cambio de contraseña en la transacción correspondiente, sin hashes, contraseñas ni tokens. El endpoint de presign restringe tipos de imagen y se protege con `catalog:update`.
- Seed idempotente con empresa, zona, tienda, ADMIN, ADVISOR y dos productos del fixture etiquetado como sintético. Contraseñas solo desde variables de entorno. No se cambió `schema.prisma`.
- Panel en `/admin/` con login, cambio obligatorio, guard de rutas y menú diferenciado por rol. Funciones de clientes, canjes, dados y dashboard todavía no existen.
- `pnpm -r typecheck`, `pnpm lint`, `pnpm knip`, `pnpm build` y `pnpm format:check` pasaron. `pnpm test`: 12 pruebas pasaron y 7 de integración quedaron omitidas por falta de `club_test` PostgreSQL.
- Pendiente antes de marcar 1B como completada: aplicar la migración en una base `club_test`, ejecutar `RUN_DB_TESTS=1 pnpm test`, ejecutar el seed y verificar el flujo de login. El usuario eligió dejar estas comprobaciones pendientes sin instalar PostgreSQL local. La prueba manual en navegador queda pendiente por la prohibición de `agents/instructions_1.md`. No se usaron credenciales externas para pruebas manuales de S3/Resend/reCAPTCHA.

## 2026-10-08 · Fases 2–5 (implementación de código local, sin AWS)

- Por instrucción posterior del usuario se avanzó con todas las fases del PROMPT 2 en esta ejecución. No se usó AWS ni se desplegó nada.
- Fase 2: inscripción con cédula validada, QR de tienda, consentimiento, reCAPTCHA, correo de bienvenida poscommit, baja idempotente con confirmación, clientes y saldo de lotes vigentes. Pantallas públicas y de clientes conectadas.
- Fase 3: canje atómico con bloqueo de cliente, producto por empresa/zona, límites diario y mensual, consumo FIFO y auditoría transaccional; historial y pantallas de asesor/admin.
- Fase 4: dados físicos con tirada única, compra superior a USD 10, ganador calculado en servidor, premio elegible, historial y gestión de premios. El asesor tiene asistente por pasos.
- Fase 5: catálogo con URL de lectura S3 y edición restringida; canjeables y premios por zona; zonas con mapa Leaflet/OSM y soft delete; ajustes visuales; usuarios y perfil; dashboard y rotación; auditoría de solo lectura. Se agregaron loaders mock para canjeables, premios y ventas.
- Verificaciones locales: `pnpm -r typecheck` pasó; `pnpm lint` pasó; `pnpm knip` pasó; `pnpm format:check` pasó; `pnpm build` compiló API y ambos frontends. `pnpm test`: **18 pasaron, 14 omitidas** (integración PostgreSQL). Las pruebas de integración están escritas, pero se omiten hasta tener PostgreSQL `club_test` y ejecutar `RUN_DB_TESTS=1`. No se afirma que los flujos transaccionales estén validados en base real.
- Pendiente de prueba manual: navegador (restricción de `agents/instructions_1.md`), correo Resend, reCAPTCHA real, subida/lectura S3 y mapa con teselas OSM. Tampoco se han ejecutado seed ni loaders, pues este equipo no tiene PostgreSQL/Docker y el usuario eligió dejar esas pruebas pendientes.
- Para completar la validación cuando se autorice un entorno: aplicar migración, ejecutar seed y loaders `db:mock:*`, correr integración contra `club_test`, revisar flujos en navegador autorizado y resolver TLS hasta origen antes de desplegar.

## 2026-10-08 · Validación AWS y preparación de producción

- El código de Fases 1A–5 se publicó en `main` (`fa42231`). Las distribuciones actuales todavía sirven HTML/API placeholder desde `dev`; el health del stub no consulta PostgreSQL.
- Verificado en AWS: EC2 `t3.medium` Amazon Linux 2023 y SSM Online; SG sólo puerto 80 desde CloudFront; dos distribuciones con caché desactivada y cookies reenviadas; bucket privado S3, cifrado SSE-S3, CORS para ambos dominios; rol EC2 con acceso S3 y hop limit IMDSv2 de 2.
- La EC2 conserva el checkout `dev` y el volumen `club_fidelizacion_postgres_prod_data`. Su `.env` aún utiliza nombres antiguos y carece de las variables requeridas por el código actual.
- Se incorporaron Dockerfiles del workspace real, nginx, Compose de producción, CI con PostgreSQL aislado y despliegue manual vía SSM en worktree separado. Ningún archivo de producción nuevo se ha desplegado en EC2 en esta fase.
- Pendientes: resultado efectivo del nuevo CI con las 14 pruebas de integración, completar `.env` de EC2, backup/restore PostgreSQL, resolver TLS y autenticación al origen, validar servicios externos y ejecutar manualmente el despliegue sólo después de esas puertas.
