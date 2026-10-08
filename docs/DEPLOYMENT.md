# EnlaceHermano · Despliegue y validación AWS

Estado comprobado el 2026-10-08: `main` contiene la app de Fases 1A–5, pero la EC2 sigue sirviendo HTML placeholder y una API stub desde el checkout `dev`. Este documento y los archivos de producción preparan un despliegue **manual**; publicar en GitHub no despliega la app.

## Infraestructura existente

- Cuenta `201930053567`, región `us-east-1`; EC2 `i-092c3e48e393d4b3c`, `t3.medium`, Amazon Linux 2023, SSM Online. No es Ubuntu.
- El SG `sg-049fdea38f1199d55` recibe TCP/80 sólo desde el prefix list de origen de CloudFront; no abre SSH ni PostgreSQL.
- Las dos distribuciones CloudFront están desplegadas, redirigen al visitante a HTTPS, desactivan caché y reenvían cookies, query strings y headers. `X-App` selecciona `form` o `admin`.
- El tramo CloudFront → EC2 usa **HTTP/80 sin cifrar**. El prefix list no identifica exclusivamente nuestras distribuciones. Para datos reales faltan TLS al origen y una cabecera de autenticación de origen u otro control equivalente.
- El bucket privado `club-enlace-assets-201930053567` existe en `us-east-1`, tiene bloqueo público completo, SSE-S3 y CORS para ambos dominios CloudFront. El versionado no está habilitado. El rol EC2 `HackatonEc2SsmRole` tiene SSM y acceso a ese bucket; IMDSv2 está requerido con hop limit 2, apropiado para contenedores. En EC2 no se guardan claves AWS: `S3Client` usa el rol.
- El volumen PostgreSQL existente se llama `club_fidelizacion_postgres_prod_data`. La base existente usa `POSTGRES_USER=club_admin` y `POSTGRES_DB=farmaenlace_prod`; **no cambiar estos valores al reutilizar el volumen**.

## Archivos de este repositorio

`docker-compose.prod.yml` mantiene PostgreSQL sin puerto publicado, ejecuta Prisma `migrate deploy` antes de iniciar Express y exige que la API responda al health antes de abrir nginx. Los Dockerfiles compilan el workspace real, sin HTML/API de sustitución ni `|| true` para ocultar errores. `.dockerignore` impide enviar `.env` y claves al contexto de build. El panel se sirve en `/admin/` y el formulario en `/`; `/api/*` va a Express.

`ci.yml` corre lint, tipos, formato, build y las pruebas de integración con PostgreSQL **aislado** en GitHub Actions. `deploy.yml` sólo admite `workflow_dispatch` y depende de ese CI. El script `scripts/deploy.sh` usa un worktree separado en `/opt/hackaton-main`, preservando `/opt/hackaton` (`dev`) y el volumen de la base. No realiza `git reset --hard`, pruning ni seed/mock en producción.

## Preparación obligatoria antes del primer despliegue

1. El [CI de `a6fc4d2`](https://github.com/XXwuzed/hackaton-connect-jipj/actions/runs/37826731307) terminó correctamente: migración, pruebas con PostgreSQL aislado, build de API/frontends y Docker/nginx. Revalidar el CI tras cada cambio antes de desplegar.
2. Respaldar el volumen PostgreSQL y ensayar restauración. No se hizo durante esta validación.
3. Actualizar **privadamente** `/opt/hackaton/.env`, sin reemplazar `POSTGRES_USER`, `POSTGRES_PASSWORD` ni `POSTGRES_DB` actuales. Usar `.env.production.example` como lista de nombres, no copiar sus placeholders. `DATABASE_URL` debe apuntar a `postgres:5432/farmaenlace_prod` y codificar caracteres especiales de la contraseña.
4. Configurar dos secretos JWT distintos de 32+ caracteres, `CONSENT_VERSION` aprobado, URLs CloudFront, bucket y Resend. No introducir claves AWS en el `.env` de EC2.
5. Verificar que el usuario/rol de GitHub para SSM tenga permisos mínimos. El workflow usa las credenciales temporales ya configuradas en GitHub; expiran. La cuenta aún no tiene proveedor OIDC de GitHub, que es el reemplazo recomendado antes de automatizar.
6. Resolver HTTP del origen y autenticación de origen antes de usar datos reales. Este sandbox permite únicamente datos sintéticos.

El `.env` de la EC2 todavía contiene nombres antiguos (`JWT_SECRET`, `CORS_ORIGIN`, `AWS_DEFAULT_REGION`, `S3_BUCKET_NAME`) y carece de los nombres requeridos por la API (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, `AWS_S3_BUCKET`, etc.). **El despliegue manual debe permanecer sin ejecutar hasta actualizarlo.**

## Comprobación posterior

Tras un despliegue manual autorizado, `/api/health` debe devolver exactamente `{"status":"ok"}`; la API placeholder actual devuelve además `app` y `timestamp`. Confirmar que `/` carga el formulario real y `/admin/` el panel real en sus dominios, que los tres contenedores estén saludables y que S3 y Resend funcionen con credenciales de producción. El simple HTTP 200 del stub no valida la aplicación.
