# API

Todas las rutas externas tienen prefijo `/api`. Las mutaciones requieren `X-Requested-With: club`. Los errores tienen forma `{ "error": { "code": "...", "message": "..." } }`.

| Método | Ruta                                        | Descripción                                                              | Acceso                                              | Fase |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------- | ---- |
| GET    | `/api/health`                               | Comprueba PostgreSQL y responde `{ "status": "ok" }`                     | Público                                             | 1A   |
| POST   | `/api/auth/login`                           | Inicia sesión; emite access 15 min y refresh 7 días en cookies HTTP-only | Público; 5 intentos/15 min por IP+correo            | 1B   |
| POST   | `/api/auth/logout`                          | Borra las cookies del navegador (JWT stateless no revocado)              | Público                                             | 1B   |
| POST   | `/api/auth/refresh`                         | Renueva sesión si el usuario sigue activo                                | Cookie refresh; bloquea si debe cambiar contraseña  | 1B   |
| GET    | `/api/auth/me`                              | Devuelve perfil seguro sin `passwordHash`                                | Cookie access; permite cambio obligatorio           | 1B   |
| POST   | `/api/auth/change-password`                 | Verifica contraseña actual, cambia hash argon2id y audita                | Cookie access; permite cambio obligatorio           | 1B   |
| POST   | `/api/uploads/presign`                      | URL temporal de subida para jpeg/png/webp bajo `products/`               | ADMIN con `catalog:update`; requiere S3 configurado | 1B   |
| GET    | `/api/public/stores/:code`                  | Nombre de tienda y empresa                                               | Público                                             | 2    |
| POST   | `/api/public/customers`                     | Inscripción con consentimiento                                           | Público; 10/h por IP                                | 2    |
| GET    | `/api/public/unsubscribe/:token`            | Nombre enmascarado y estado, sin efectos                                 | Público                                             | 2    |
| POST   | `/api/public/unsubscribe/:token`            | Baja idempotente                                                         | Público                                             | 2    |
| GET    | `/api/customers`                            | Búsqueda, filtros, saldo, `scope`, paginación                            | ADMIN/ADVISOR                                       | 2    |
| GET    | `/api/customers/:id`                        | Perfil, saldo e historial                                                | ADMIN/ADVISOR                                       | 2–4  |
| GET    | `/api/redeemable-products`                  | Canjeables; asesor solo su empresa/zona                                  | ADMIN/ADVISOR                                       | 3    |
| POST   | `/api/redeemable-products`                  | Vincular catálogo, puntos, descuento y zonas                             | ADMIN                                               | 5    |
| PATCH  | `/api/redeemable-products/:id`              | Editar o desactivar vínculo                                              | ADMIN                                               | 5    |
| POST   | `/api/redeemable-products/bulk-assign-zone` | Asignación múltiple a zona activa                                        | ADMIN                                               | 5    |
| GET    | `/api/redemptions`                          | Historial global filtrable                                               | ADMIN                                               | 3    |
| GET    | `/api/redemptions/:id`                      | Detalle y lotes consumidos                                               | ADMIN                                               | 3    |
| POST   | `/api/redemptions`                          | Canje de 1–2 `productIds` del catálogo                                   | ADVISOR                                             | 3    |
| GET    | `/api/dice/prizes`                          | Premios; asesor solo su empresa/zona                                     | ADMIN/ADVISOR                                       | 4    |
| POST   | `/api/dice/prizes`                          | Crear premio desde catálogo                                              | ADMIN                                               | 4    |
| PATCH  | `/api/dice/prizes/:id`                      | Estado y zonas                                                           | ADMIN                                               | 4    |
| GET    | `/api/dice/rolls`                           | Historial global filtrable                                               | ADMIN                                               | 4    |
| GET    | `/api/dice/rolls/:id`                       | Detalle de tirada                                                        | ADMIN                                               | 4    |
| POST   | `/api/dice/rolls`                           | Resultado físico y productos comprados                                   | ADVISOR                                             | 4    |
| GET    | `/api/products`                             | Catálogo; asesor solo lectura de su empresa para dados                   | ADMIN/ADVISOR                                       | 5    |
| GET    | `/api/products/:id`                         | Detalle de catálogo                                                      | ADMIN                                               | 5    |
| PATCH  | `/api/products/:id`                         | Solo `imageKey` y `description`                                          | ADMIN                                               | 5    |
| GET    | `/api/zones`                                | Zonas no eliminadas                                                      | ADMIN                                               | 5    |
| POST   | `/api/zones`                                | Crear centro/radio                                                       | ADMIN                                               | 5    |
| PATCH  | `/api/zones/:id`                            | Editar/desactivar                                                        | ADMIN                                               | 5    |
| DELETE | `/api/zones/:id`                            | Baja lógica                                                              | ADMIN                                               | 5    |
| GET    | `/api/settings/loyalty`                     | Factor visual                                                            | ADMIN                                               | 5    |
| PATCH  | `/api/settings/loyalty`                     | Actualizar factor visual                                                 | ADMIN                                               | 5    |
| GET    | `/api/users`                                | Usuarios paginados y opciones de asignación                              | ADMIN                                               | 5    |
| POST   | `/api/users`                                | Usuario con contraseña temporal                                          | ADMIN                                               | 5    |
| PATCH  | `/api/users/:id`                            | Editar/desactivar/reactivar                                              | ADMIN                                               | 5    |
| POST   | `/api/users/:id/reset-password`             | Nueva contraseña temporal                                                | ADMIN                                               | 5    |
| PATCH  | `/api/users/me`                             | Nombre y apellido propios                                                | ADMIN/ADVISOR                                       | 5    |
| GET    | `/api/dashboard/summary?month=YYYY-MM`      | Tres agregados mensuales                                                 | ADMIN                                               | 5    |
| GET    | `/api/dashboard/product-rotation`           | Ventas y margen por producto                                             | ADMIN                                               | 5    |
| GET    | `/api/audit-logs`                           | Log inmutable filtrable                                                  | ADMIN                                               | 5    |

Las listas usan `page` y `pageSize` (5, 10, 20 o 50); máximo 50. El código existe, pero las rutas con base de datos todavía no se han probado contra PostgreSQL real.
