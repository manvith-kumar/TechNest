# Architecture

```
Browser (React + Vite, :5173)
   |  /api, /uploads  (Vite proxy in dev; CORS also configured)
   v
Spring Boot REST API (:8080)
   Controller -> Service (interface + impl) -> Repository (Spring Data JPA) -> MySQL 8
        |            |
     DTOs +       business rules, transactions, pricing, stock
     validation
```

## Backend packages (`com.technest`)
`config` (properties, static uploads) · `controller` · `service` + `service.impl` · `repository` (Spring Data, Specifications, native analytics) · `entity` · `dto` (records grouped by area) · `mapper` · `security` · `exception` · `validation` · `enums` · `util`.

* Controllers validate input (`@Valid`), delegate, and return DTOs. Entities never leave the service layer.
* Services own business logic and `@Transactional` boundaries (`readOnly` for queries).
* One `GlobalExceptionHandler` returns a consistent body: `{timestamp, status, error, message, path, fieldErrors}`; unexpected errors return a generic message and are logged, never leaked.

## Authentication and authorization
* Login returns a **15-minute JWT access token** in the response body. The frontend keeps it **in memory only**.
* A **7-day refresh token** is an opaque random value in an **HttpOnly, SameSite=Strict cookie** scoped to `/api/v1/auth`. Only its SHA-256 is stored. Each refresh **rotates** the token; presenting an already-rotated token revokes every session of that user (theft detection).
* `/auth/refresh` and `/auth/logout` also require an `X-Requested-With` header, which cross-site forms cannot send, so CSRF tokens are unnecessary for this design. All other endpoints use the bearer header, which browsers never attach automatically.
* Passwords: BCrypt (cost 10), policy 8-72 chars with upper, lower and digit. Login lockout after 5 failures for 15 minutes (in memory; use a shared store for multiple instances). Unknown emails take the same time as wrong passwords, and error text is identical.
* Authorization is enforced on the server three ways: URL rules (`/api/v1/admin/**` requires ADMIN), `@PreAuthorize` on every admin controller, and **ownership checks in the data access** (orders, addresses, cart items and reviews are looked up by id *and* user, so other people's ids look like "not found"). The JWT filter reloads the user on each request, so deactivation and role changes apply immediately.
* The role is never accepted from a request body.

## Checkout (`OrderServiceImpl.place`, one transaction)
1. If the idempotency key was already used, return that order.
2. Load the address (owned by the user) and the server-side cart; lock-order the lines by product id.
3. Reject simulated payment failures before any side effect.
4. For each line: atomic conditional stock decrement; read the **current price from the database**; snapshot name, image and price into `order_items`.
5. Recompute subtotal, savings, shipping and total with `PricingCalculator` (`BigDecimal`); client totals are never accepted.
6. Create order, payment (COD pending, or demo online paid and flagged `simulated`), and the first status-history row; write inventory history; remove only the purchased lines from the cart.
Any exception rolls the whole transaction back, so there are no partial orders and no stock leaks.

## Order lifecycle
`PLACED -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED`, with `CANCELLED` reachable from PLACED, CONFIRMED and PROCESSING (customers only before PROCESSING). DELIVERED and CANCELLED are terminal. Cancelling restores stock once and refunds (simulated) or voids the payment. Marking a COD order delivered marks it paid.

## Frontend
React 18 + Vite + Tailwind. Routes are code-split, and the **admin area is a separate lazy bundle**. State: Auth, Cart, Wishlist and Compare contexts; every HTTP call goes through `src/services/*` over one Axios instance that attaches the token, de-duplicates concurrent refreshes, and retries a 401 once. Route guards are a UX layer only; the API is the authority. Filters, sort and page live in the URL query string so results are shareable.

## Design system
Palette and typography follow the brief exactly (tokens in `tailwind.config.js`): Manrope for headings, Inter for body, Plus Jakarta Sans for navigation and admin titles, Space Grotesk for the wordmark, prices and promotional headlines, DM Sans for labels. Icons are Lucide. Product images have an inline SVG fallback so broken URLs never break layout.
