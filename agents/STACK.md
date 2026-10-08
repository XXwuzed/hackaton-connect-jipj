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

No se usa Next.js ni FastAPI. Los dos frontends son proyectos distintos dentro del mismo monorepo, pero comparten URL pública. El panel usa cookies JWT HTTP-only; la UI solo oculta opciones, el API impone permisos.

La EC2 ya existía antes del PROMPT 2. **No instalar ni desplegar nada en AWS durante la implementación local de Fases 1B–5.** El código no implica que el servicio esté desplegado.

El plan inicial CloudFront → EC2 por HTTP/80 cifra el tramo visitante → CloudFront, pero no CloudFront → EC2; además, contradice la regla HTTPS de `agents/instructions_1.md`. Antes de desplegar se debe resolver expresamente ese conflicto (TLS hasta el origen o una excepción explícita solo para la demo sintética). Para datos reales hay que cifrar también el origen y revisar dominio/certificado. El Security Group con prefix list permite otras distribuciones de CloudFront; antes de exponer el origen, nginx debe validar una cabecera privada añadida por nuestra distribución. `/api/*` requiere caché deshabilitada y reenvío de cookies, cabeceras y parámetros. Nada de esto está desplegado todavía.

Alcance funcional vigente: compras en punto de venta, no pagos online; dados físicos registrados por asesor. La inscripción, canjes, dados, productos y dashboard están implementados en código para fases 2–5, pendientes de integración con PostgreSQL y de prueba manual autorizada. No ampliar el negocio por la tabla de infraestructura sin una decisión explícita.
