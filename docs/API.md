# REST API reference

Base path `/api/v1`. JSON in and out. **Auth**: `-` public, `User` needs `Authorization: Bearer <accessToken>`, `Admin` needs an ADMIN token. Lists use `{content, page, size, totalElements, totalPages, last}`. Errors use `{timestamp, status, error, message, path, fieldErrors}`.

Status codes: 200/201 success, 400 validation or bad input, 401 missing/expired/invalid token or bad credentials, 402 simulated payment declined, 403 forbidden (role or deactivated), 404 not found (also for other users' resources), 409 conflict (duplicate email, insufficient stock, invalid status change), 413 file too large, 429 login locked.

## Authentication
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | - | `{fullName,email,password,phone?}` -> 201 `{accessToken,expiresInSeconds,user}` + refresh cookie |
| POST | `/auth/login` | - | `{email,password}` |
| POST | `/auth/refresh` | cookie + `X-Requested-With` | rotates the refresh token |
| POST | `/auth/logout` | cookie + `X-Requested-With` | revokes the session |
| POST | `/auth/forgot-password` | - | always 200 with a generic message |
| POST | `/auth/reset-password` | - | `{token,newPassword}` |
| GET / PUT | `/users/me` | User | profile `{fullName,phone}` |
| PUT | `/users/me/password` | User | `{currentPassword,newPassword}`; ends other sessions, returns a new session |

## Catalogue (public)
| Method | Path | Notes |
|---|---|---|
| GET | `/products` | `q, categoryId, brand (repeatable), minPrice, maxPrice, minRating, inStock, featured, onSale, sort, page, size` ; `sort` = `newest, popular, rating, price_asc, price_desc, name`; size max 48 |
| GET | `/products/search?q=` | name, brand or category; every word must match |
| GET | `/products/{id}` | detail with images and specifications |
| GET | `/products/featured`, `/products/collections/{type}` | `type` = `featured, trending, best-sellers, new-arrivals, deals, recommended`; `limit` |
| GET | `/products/category/{categoryId}` | paginated |
| GET | `/products/{id}/related` | same category |
| GET | `/products/brands` | active brands |
| GET | `/products/compare?ids=1,2,3` | 2-4 products, same category only (else 400) |
| GET | `/categories`, `/categories/{id}` | with product counts |
| GET | `/products/{id}/reviews`, `/reviews/summary` | list, rating distribution |
| GET | `/products/{id}/reviews/eligibility` | User; may the caller review? |
| POST | `/newsletter` | `{email}` |

## Customer (User)
| Method | Path | Notes |
|---|---|---|
| GET | `/cart` | server-priced totals, `checkoutBlocked` |
| POST | `/cart/items` | `{productId,quantity 1-10}`; 409 if above stock |
| PUT / DELETE | `/cart/items/{id}` | `{quantity}` |
| DELETE | `/cart` | clear |
| GET / POST / DELETE | `/wishlist`, `/wishlist/{productId}` | add and remove are idempotent |
| GET / POST / PUT / DELETE | `/addresses`, `/addresses/{id}` | max 10; first address becomes default |
| POST | `/orders` | `{addressId,paymentMethod: COD\|DEMO_ONLINE, cartItemIds?, idempotencyKey?, simulatePaymentFailure?}` (also `Idempotency-Key` header); totals are never read from the client |
| GET | `/orders/my-orders?page&size` | newest first |
| GET | `/orders/{id}` | own orders only |
| POST | `/orders/{id}/cancel` | only PLACED or CONFIRMED |
| POST | `/products/{id}/reviews` | delivered purchase required; one per product (409 otherwise) |
| PUT / DELETE | `/reviews/{id}` | own review |
| POST | `/reviews/{id}/report` | flags for moderation |

## Admin (Admin)
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/dashboard` | totals, last-6-month sales, status counts, category sales, top products, recent orders, low stock |
| GET | `/admin/reports?from&to` | ISO dates; sales, AOV, monthly revenue, top products and categories, customer growth, inventory, payment split |
| GET / POST | `/admin/products` | list accepts `q, categoryId, active, featured, brand, minPrice, maxPrice`; includes inactive |
| GET / PUT / DELETE | `/admin/products/{id}` | delete deactivates when the product has order history |
| POST / PUT / DELETE | `/admin/categories[/{id}]` | `DELETE ?reassignTo=` moves products first; 409 otherwise |
| GET | `/admin/inventory?q&status=all\|low\|out\|in` | |
| POST | `/admin/inventory/{productId}/adjust` | `{delta,reason RESTOCK\|ADJUSTMENT,note?}`; never below zero |
| GET | `/admin/inventory/{productId}/history` | |
| GET | `/admin/orders` | `q, status, from, to, page, size` |
| GET | `/admin/orders/{id}` | |
| PUT | `/admin/orders/{id}/status` | `{status,note?}`; only valid transitions, else 409 |
| POST | `/admin/orders/{id}/cancel` | restores stock once |
| GET | `/admin/customers?q`, `/admin/customers/{id}` | profile, addresses, purchase history, total spent |
| PATCH | `/admin/customers/{id}/status` | `{enabled}`; deactivation also revokes sessions |
| GET | `/admin/reviews?reported=true` | |
| DELETE | `/admin/reviews/{id}` | recalculates the product rating |
| PATCH | `/admin/reviews/{id}/dismiss-report` | |
| POST | `/admin/uploads` | multipart `file`; JPEG/PNG/WebP/GIF, 5 MB, signature checked; returns `{url}` |

`GET /health` (public) returns `{"status":"UP"}`.
