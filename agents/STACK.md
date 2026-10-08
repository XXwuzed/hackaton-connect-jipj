# Stack aprobado y límites de ejecución

Fecha: 2026-10-08 (America/Guayaquil).

| Capa           | Decisión                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Cliente        | React + Vite + Tailwind, compilación estática en `/`                                                  |
| Panel          | React + Vite + Tailwind, compilación estática en `/admin`                                             |
| API            | Node.js + Express + TypeScript + Prisma, rutas externas `/api/*`                                      |
| Base de datos  | PostgreSQL en contenedor privado, sin publicar 5432                                                   |
| Web            | nginx en contenedor, sirve ambos bundles y reenvía `/api/*`                                           |
| Host previsto  | Una EC2 `t3.medium` con Amazon Linux 2023, Docker Compose y SSM; sin SSH                              |
| Borde previsto | CloudFront con HTTPS al visitante y origen EC2 restringido al prefix list de CloudFront               |
| Datos          | Solo datos sintéticos; compras/pagos reales y datos personales reales están prohibidos en AWS Sandbox |

No se usa Next.js ni FastAPI. Los dos frontends son proyectos distintos dentro del mismo monorepo, servidos por nginx a través de dos distribuciones CloudFront. El panel usa cookies JWT HTTP-only; la UI solo oculta opciones, el API impone permisos.

La EC2 ya existía antes del PROMPT 2. El código de Fases 1B–5 se implementó sin desplegarlo. La validación AWS posterior comprobó que la EC2 sigue sirviendo placeholders; `docs/DEPLOYMENT.md` documenta el estado y los bloqueos actuales.

CloudFront → EC2 está realmente configurado por HTTP/80: cifra visitante → CloudFront, pero no el origen, y contradice la regla HTTPS de `agents/instructions_1.md`. No usar datos reales hasta cifrar también el origen y limitarlo a nuestras distribuciones con una cabecera privada u otro control equivalente. `/api/*` tiene caché deshabilitada y reenvío de cookies, cabeceras y parámetros en CloudFront. La app nueva todavía no se desplegó.

Alcance funcional vigente: compras en punto de venta, no pagos online; dados físicos registrados por asesor. La inscripción, canjes, dados, productos y dashboard están implementados en código para fases 2–5, pendientes de integración con PostgreSQL y de prueba manual autorizada. No ampliar el negocio por la tabla de infraestructura sin una decisión explícita.
