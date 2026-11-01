# TechNest
**Discover. Explore. Shop.**

A full-stack electronics e-commerce application: a React storefront for customers, a separate admin console, a Spring Boot REST API and a MySQL database.

> **Project status in one paragraph.** The database, frontend and all pure business logic were built *and run* during development. The Spring Boot backend is fully written but could **not be compiled or started** in the build environment (it had no access to Maven Central), so it is syntax-checked only. Run `mvn test` and the checklist in [Verification status](#verification-status) on your machine before relying on it. Nothing here has been pushed to GitHub.

## Objectives
Build a realistic, secure shopping platform where customers can discover, compare and buy electronics, and administrators can run the business from one console, with server-side enforcement of every rule that matters (prices, stock, ownership, roles).

## Key features
**Customer:** registration, login/logout, forgot and reset password, profile and password change; home page with hero and curated sections; catalogue with server-side pagination, search (name, brand, category), filters (category, brand, price, rating, availability), five sort orders, grid/list views and quick view; product pages with gallery, specs, reviews and related items; compare 2-4 products in the same category; persistent cart, wishlist and address book; five-step checkout with Cash on Delivery or a clearly-labelled **simulated** online payment; order history, tracking timeline and cancellation; verified-purchase reviews (create, edit, delete, report).

**Admin:** KPI dashboard and Recharts analytics from live aggregate queries; product CRUD with image upload and specification editor; category CRUD with safe reassignment; inventory with low/out-of-stock views, adjustments and audit history; order search, filter and guarded status transitions; customer list, history and activate/deactivate; review moderation; reports with date ranges.

**Platform:** BCrypt, JWT access tokens plus rotating HttpOnly refresh cookie, role-based authorization enforced on the server, ownership checks, idempotent checkout, atomic stock handling, Flyway migrations, consistent error format.

## Technology
React 18, Vite, Tailwind CSS 3, React Router 6, Axios, Context API, Lucide, react-hot-toast, Recharts, Vitest · Java 21, Spring Boot 3.3, Spring Web / Data JPA / Security, Hibernate, Bean Validation, Lombok, JJWT, Flyway, Maven, JUnit 5, Mockito · MySQL 8.

## Architecture, database, API
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DATABASE.md](docs/DATABASE.md), [docs/API.md](docs/API.md) and [docs/SETUP.md](docs/SETUP.md).

## Folder structure
```
TechNest/
├── backend/            Spring Boot API  (src/main/java/com/technest/{config,controller,service,service/impl,repository,entity,dto,mapper,security,exception,validation,enums,util})
├── frontend/           React app        (src/{components,pages,layouts,context,hooks,services,utils,routes,test})
├── database/           create_database.sql, migrations/ (V1 schema, V2 seed), tools/generate_seed.py
├── docs/               API, DATABASE, ARCHITECTURE, SETUP
├── screenshots/
├── README.md
└── .gitignore
```

## Quick start
Full instructions: [docs/SETUP.md](docs/SETUP.md). In short:
```
mysql -u root -p < database\create_database.sql
cd backend && copy .env.example .env      # set DB_PASSWORD and a random JWT_SECRET
mvn spring-boot:run                        # http://localhost:8080
cd ..\frontend && npm install && npm run dev   # http://localhost:5173
```
Flyway creates the schema and sample data on first start. Configuration lives in `backend/.env` (see `backend/.env.example`) and `frontend/.env` (see `frontend/.env.example`). No paid or third-party service is needed.

## Development credentials (sample data only, never for production)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@technest.dev` | `Admin@12345` |
| Customer | `customer@technest.dev` | `Customer@12345` |

Other seeded customers (`aarav.sharma@example.com` etc.) share the customer password; `sneha.reddy@example.com` is seeded as *deactivated* so you can see that state. These exist only in the seed script. **Change or delete them before any real deployment.**

## Behaviour worth knowing
* **Currency** is INR (₹), set by `VITE_CURRENCY` / `VITE_LOCALE`. Prices include tax. Delivery is free from ₹5,000 and a flat ₹99 below that (`SHIPPING_FREE_THRESHOLD`, `SHIPPING_FLAT_FEE`).
* **Sample data:** catalogue entries, prices, reviews and testimonials are illustrative, not official retail prices. Product photos use Unsplash URLs that could not be network-checked during the build; broken images fall back to a generated placeholder, and admins can replace them or upload their own.
* **Payments are simulated.** No gateway, no card data. The demo option marks the order paid with a `DEMO-` reference and offers a "simulate declined payment" switch to exercise the failure path.
* **Password reset** has no mail server. With `LOG_RESET_LINKS=true` (dev only) the link is written to the backend log.
* Login lockout counters and refresh-token rotation are per-instance/per-session; see ARCHITECTURE for multi-instance notes.

## Verification status
Honest account of what was actually executed during the build.

| Area | Status | Evidence |
|---|---|---|
| MySQL schema, constraints, generated column | **Executed** on MySQL 8.0.46 | Loaded cleanly; CHECK constraints reject bad data |
| Seed data integrity | **Executed** | Order totals = item sums; rating aggregates = reviews; status = last history row; BCrypt hashes verify against the documented passwords |
| Dashboard / report SQL (7 native queries) | **Executed** against seeded MySQL | Extracted from the Java source and run |
| Oversell protection | **Executed** | 40 concurrent buyers, 7 units: exactly 7 sold, stock never negative; DB CHECK blocks negative stock |
| Pure Java logic (order transitions, pricing, slugs, hashing, order numbers) | **Executed** via a plain-Java harness | 17/17 assertions |
| Frontend build | **Executed** | `vite build` succeeds; admin code-split |
| Frontend tests | **Executed** | 32/32 Vitest tests (formatting, errors, validation, totals, route guards incl. customer-blocked-from-admin, product card, API client refresh/replay/single-flight) |
| Spring Boot source | **Syntax-parsed only** | All 122 files parse; not type-checked, not compiled |
| JUnit/Mockito unit tests (5 classes) and Spring integration test | **Written, not run** | `mvn test` needs Maven Central |
| Backend REST endpoints, security wiring, JPA mappings, Flyway startup | **Not run** | Run the checklist below |
| Frontend against the live API, responsive layout, screenshots | **Not run** | No backend and no browser in the build environment |

**First-run checklist on your machine:** (1) `mvn test` - fix any compile error first; (2) start the backend and open `/api/v1/health`; (3) sign in as the customer, add to cart, add an address, place an order, confirm the stock dropped in MySQL; (4) sign in as admin, move the order through each status, confirm the customer sees it; (5) try cancelling an order and confirm stock returns once; (6) confirm a customer token gets 403 on `/api/v1/admin/dashboard`. Please report anything that fails; the most likely issues are small compile or mapping errors, since the code has not met a compiler.

## Future enhancements
Email delivery for resets and order updates; a real payment gateway; coupon codes; saved-card tokens; shared rate limiting (Redis); search engine integration; image resizing/CDN; product variants; returns workflow; admin audit log; Playwright end-to-end tests; CI pipeline.

## Publishing to GitHub
```
cd TechNest
git init -b main            (already done locally)
git add .
git commit -m "feat: TechNest full-stack electronics store"
git remote add origin https://github.com/<your-user>/technest.git
git push -u origin main
```
Check `git status` first: `.env` files, `node_modules`, `target` and `uploads` must not appear.
