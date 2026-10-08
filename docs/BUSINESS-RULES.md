# Reglas de negocio

## Clientes

- Cédula ecuatoriana de 10 dígitos y checksum módulo 10; RUC rechazado: `packages/contracts/src/national-id.ts`. La unicidad de `nationalId` incluye bajas: `customers/services/register.service.ts`.
- Registro público exige consentimiento y tienda activa; copia la zona de la tienda, registra `CONSENT_VERSION` y audita en la misma transacción. Resend se invoca después del commit y su fallo no revierte: `customers/services/register.service.ts`.
- Baja: GET informativo sin efecto y POST idempotente con `status=UNSUBSCRIBED`; queda auditado: `customers/services/unsubscribe.service.ts`.
- El asesor ve por defecto todos los clientes; `scope=zone` limita a su zona: `customers/services/list.service.ts`. Puede canjear y registrar dados a cualquier cliente activo.

## Puntos y vencimiento

- Puntos precalculados entran como lotes, sin endpoint de suma. Saldo vigente agregado excluye lotes vencidos y vacíos: `points/points.service.ts`.
- Cada lote vence un año civil después, al final del día Guayaquil: `shared/time.ts`; lo usan los loaders mock.
- Canje consume primero el lote de menor `expiresAt`, luego menor `earnedAt`, y crea un `PointsLotUsage` por consumo: `points/consume.service.ts`. No hay job de vencimiento.
- `LoyaltySettings.pointsPerDollar` solo alimenta la calculadora UI (`ceil(USD × factor)`), no calcula puntos reales: `settings/settings.service.ts` y `admin-web/features/settings/pages/Loyalty.tsx`.

## Canjes

- Solo ADVISOR puede crear. Producto y vínculo deben estar activos, pertenecer a su empresa y estar asignados a su zona activa; se usa la tienda del asesor: `redemptions/redemptions.service.ts`.
- Máximo dos canjes por cliente y día Guayaquil, en todas las tiendas/empresas, y cuatro del mismo producto por mes calendario Guayaquil. Saldo válido debe ser mayor o igual que el costo total: mismo servicio.
- Se bloquea la fila del cliente; se valida, crea, consume FIFO y audita en una transacción. Una solicitud de uno o dos productos es todo o nada. `pointsCost` y `productName` son snapshot.

## Dados

- Solo ADVISOR registra una tirada física por cliente de por vida; compras de productos activos de su empresa y monto estrictamente mayor a USD 10. El `DiceRoll.customerId @unique` cubre carreras simultáneas: `dice/dice.service.ts`.
- Dados 1 y 2 entre 1–6; `isWinner` lo calcula el servidor y solo 6+6 exige premio activo de empresa/zona del asesor. No modifica puntos: mismo servicio.

## Catálogo, zonas y analítica

- El catálogo se edita solo en imagen y descripción; imágenes bajo `products/`, URL de lectura firmada y subida prefirmada S3: `products/products.dto.ts`, `products/products.service.ts`, `shared/storage.ts`.
- Canjeables y premios nacen de un producto del catálogo, con zonas activas; desactivar vínculo no borra producto: `redeemable-products/redeemable.service.ts` y `dice/dice.service.ts`.
- Zonas pueden desactivarse o eliminarse lógicamente; una zona no activa/no existente no se asigna a nuevos vínculos: `zones/zones.service.ts` y servicios de canjeables/premios.
- Dashboard agrega registros, bajas y puntos canjeados por mes local Guayaquil; rotación lee `ProductSalesSummary`: `dashboard/dashboard.service.ts`.

## Permisos

En Fase 1B se implementaron las bases:

- Login con hash argon2id, tokens JWT cortos en cookies HTTP-only y verificación de `user.active` en cada solicitud autenticada: `hackaton-backend/src/modules/auth/` y `src/shared/middlewares/authenticate.ts`.
- `mustChangePassword` limita la sesión a consultar el perfil y cambiar contraseña; refresh también se bloquea. Logout sigue disponible para poder cerrar el navegador.
- RBAC de ADMIN y ADVISOR: `hackaton-backend/src/shared/authz/permissions.ts`, contratos en `packages/contracts/src/permissions.ts` y middleware `authorize.ts`. ADMIN no registra canjes ni dados.
- Política ABAC para empresa y zona del asesor: `hackaton-backend/src/shared/authz/policies.ts`, aplicada en canjes y lectura de canjeables/premios. El asesor también puede leer productos activos de su empresa por el flujo de dados, sin permiso de edición.
- Cada login correcto/fallido y cambio de contraseña se audita sin contraseñas, hashes ni tokens: `hackaton-backend/src/modules/audit/audit.service.ts` y servicios de auth. `audit.log` participa en la transacción.

Las mutaciones de negocio usan `audit.log(tx, entry)` dentro de la misma transacción. Solo ADMIN lee auditoría; no hay endpoints de modificación. El seed de 1B crea organización, usuarios y productos sintéticos; clientes, lotes, canjeables, premios y ventas se cargan mediante loaders mock separados.
