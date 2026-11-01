# TechNest

### Discover. Explore. Shop.

**TechNest** is a full-stack electronics e-commerce web application with
a customer storefront, an administrator console, a Spring Boot REST API,
and a MySQL database.

**GitHub repository:** https://github.com/manvith-kumar/TechNest

------------------------------------------------------------------------

## Table of contents

-   [Project overview](#project-overview)
-   [Objectives](#objectives)
-   [Features](#features)
-   [Technology stack](#technology-stack)
-   [Architecture](#architecture)
-   [Project structure](#project-structure)
-   [Requirements](#requirements)
-   [Installation and setup](#installation-and-setup)
-   [Development accounts](#development-accounts)
-   [Configuration](#configuration)
-   [Database and migrations](#database-and-migrations)
-   [API and documentation](#api-and-documentation)
-   [Testing and build verification](#testing-and-build-verification)
-   [Business rules and demo
    behaviour](#business-rules-and-demo-behaviour)
-   [Security considerations](#security-considerations)
-   [Troubleshooting](#troubleshooting)
-   [Future enhancements](#future-enhancements)
-   [Contributing](#contributing)
-   [License](#license)

------------------------------------------------------------------------

## Project overview

TechNest provides an online shopping experience for electronics such as
phones, laptops, audio products, smartwatches, and accessories.
Customers can discover products, compare items, manage a cart and
wishlist, place orders, and follow order progress. Administrators can
manage products, categories, stock, orders, customers, reviews, and
reports.

The application is designed so that important business rules---including
price calculation, stock handling, order ownership, and role
permissions---are enforced by the backend rather than trusted to the
browser.

### User roles

  -----------------------------------------------------------------------
  Role                                Responsibilities
  ----------------------------------- -----------------------------------
  **Customer**                        Browse and search products, compare
                                      items, manage
                                      cart/wishlist/addresses, place
                                      orders, track purchases, and submit
                                      reviews.

  **Admin**                           Manage the catalogue, categories,
                                      inventory, orders, customers,
                                      reviews, and business reports.
  -----------------------------------------------------------------------

## Objectives

-   Build a complete electronics shopping workflow.
-   Provide separate customer and administrator experiences.
-   Implement authentication and role-based access control.
-   Enforce pricing, stock, ownership, and order rules on the server.
-   Use MySQL for persistent data and Flyway for schema versioning.
-   Keep frontend, backend, database scripts, and documentation
    organized separately.

## Features

### Customer storefront

  ------------------------------------------------------------------------------
  Module                              Features
  ----------------------------------- ------------------------------------------
  Authentication                      Registration, login/logout, forgot/reset
                                      password, profile management, and password
                                      change.

  Home page                           Hero section and curated product sections.

  Catalogue                           Server-side pagination, search by
                                      name/brand/category,
                                      category/brand/price/rating/availability
                                      filters, five sort orders, grid/list
                                      views, and quick view.

  Product details                     Image gallery, specifications, reviews,
                                      and related products.

  Comparison                          Compare 2--4 products from the same
                                      category.

  Cart and wishlist                   Persistent cart and saved products.

  Addresses                           Add and manage delivery addresses.

  Checkout                            Five-step checkout with Cash on Delivery
                                      or simulated online payment.

  Orders                              Order history, order details, tracking
                                      timeline, and cancellation where allowed.

  Reviews                             Verified-purchase review creation,
                                      editing, deletion, and reporting.
  ------------------------------------------------------------------------------

### Admin console

  -----------------------------------------------------------------------
  Module                              Features
  ----------------------------------- -----------------------------------
  Dashboard                           KPI dashboard and Recharts
                                      analytics using aggregate queries.

  Products                            Product CRUD, image upload, and
                                      specification editor.

  Categories                          Category management and safe
                                      reassignment.

  Inventory                           Low-stock/out-of-stock views, stock
                                      adjustments, and inventory history.

  Orders                              Order search, filters, and guarded
                                      status transitions.

  Customers                           Customer listing, order history,
                                      and activate/deactivate controls.

  Reviews                             Review moderation.

  Reports                             Reports with date-range selection.
  -----------------------------------------------------------------------

### Platform features

-   BCrypt password hashing.
-   JWT access tokens and rotating HttpOnly refresh cookie.
-   Server-side role authorization and ownership checks.
-   Idempotent checkout behaviour.
-   Atomic stock handling to help prevent overselling.
-   Consistent API error responses.
-   Flyway database migrations.

## Technology stack

  -----------------------------------------------------------------------
  Layer                               Technologies
  ----------------------------------- -----------------------------------
  Frontend                            React 18, Vite, JavaScript,
                                      Tailwind CSS 3

  Routing and state                   React Router 6, Context API

  HTTP and UI                         Axios, Lucide, react-hot-toast

  Charts and frontend tests           Recharts, Vitest

  Backend                             Java 21, Spring Boot 3.3.5

  Backend modules                     Spring Web, Spring Data JPA, Spring
                                      Security, Hibernate, Bean
                                      Validation, Lombok

  Authentication                      JJWT, BCrypt

  Database                            MySQL 8, Flyway

  Build tools                         Maven, npm

  Backend tests                       JUnit 5, Mockito
  -----------------------------------------------------------------------

## Architecture

``` text
                 CUSTOMER / ADMIN
                        |
                        v
              React + Vite Frontend
                http://localhost:5173
                        |
                    REST API
                        |
                        v
             Spring Boot Backend API
                http://localhost:8080
                        |
              Spring Security / JWT
                        |
              Controllers and services
                        |
                        v
                 MySQL 8 Database
                   technest_db
                        |
                        v
                 Flyway migrations
```

**Frontend:** Renders the storefront and admin console, handles
navigation and UI state, and calls the backend APIs.

**Backend:** Controllers expose REST endpoints; services apply business
rules and validation; repositories and Hibernate persist application
data.

**Database:** Stores user, product, category, inventory, cart, order,
payment, review, and related records.

**Flyway:** Validates and applies versioned database migrations when the
backend starts.

More details are available in the `docs/` directory.

## Project structure

``` text
TechNest/
├── backend/
│   ├── src/main/java/com/technest/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── service/impl/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   ├── mapper/
│   │   ├── security/
│   │   ├── exception/
│   │   ├── validation/
│   │   ├── enums/
│   │   └── util/
│   ├── src/test/
│   ├── .env.example
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── routes/
│   │   └── test/
│   ├── .env.example
│   └── package.json
├── database/
│   ├── create_database.sql
│   ├── migrations/
│   └── tools/
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── SETUP.md
├── screenshots/
├── .gitignore
└── README.md
```

## Requirements

Install the following software:

  Software               Version
  ---------------------- -------------------------
  Java Development Kit   21
  Apache Maven           3.9 or compatible
  Node.js                20 or later recommended
  npm                    Included with Node.js
  MySQL Server           8.0
  Git                    Recent version

Check installed versions:

``` powershell
java -version
mvn -version
node -v
npm -v
mysql --version
git --version
```

## Installation and setup

The following commands use Windows PowerShell. Run the backend and
frontend in separate terminals and leave both running during local
development.

### 1. Clone the repository

``` powershell
git clone https://github.com/manvith-kumar/TechNest.git
cd TechNest
```

The current repository branch is `master`.

### 2. Create the database

Start MySQL 8, then run:

``` powershell
mysql -u root -p < database/create_database.sql
```

Enter your local MySQL root password when prompted. Review
`database/create_database.sql` and `docs/DATABASE.md` if your local
MySQL account or database setup differs.

The example backend configuration uses database name `technest_db`.
Ensure the database name, username, password, host, and port match your
MySQL installation.

### 3. Configure the backend

From the project root:

``` powershell
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` and replace the placeholder database credentials and
JWT secret with values for your environment.

Example:

``` env
DB_HOST=localhost
DB_PORT=3307
DB_NAME=technest_db
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password
JWT_SECRET=replace_with_a_long_random_secret_of_at_least_32_characters
CORS_ALLOWED_ORIGINS=http://localhost:5173
COOKIE_SECURE=false
LOG_RESET_LINKS=true
```

**Important configuration notes:** - The checked-in
`backend/.env.example` uses port `3307`, matching the local MySQL 8
instance used during verification. Change it if your MySQL server
listens on another port. - Replace the example database
username/password with a valid MySQL account that has the required
privileges. - Generate a long, unique JWT secret. Do not use the
placeholder. - `COOKIE_SECURE=false` is intended for local HTTP
development. Use HTTPS and secure cookies in production. -
`LOG_RESET_LINKS=true` is a development-only option. Password-reset
links are written to backend logs because no mail server is configured.

Never commit `backend/.env`.

### 4. Run backend tests and start Spring Boot

``` powershell
cd backend
mvn clean test
```

If the tests pass, start the backend:

``` powershell
mvn spring-boot:run
```

Backend address:

``` text
http://localhost:8080
```

Flyway validates and applies pending migrations and sample data during
startup. Keep this terminal running.

### 5. Configure and start the frontend

Open a second terminal from the project root:

``` powershell
cd frontend
npm install
Copy-Item .env.example .env
```

The example frontend configuration is:

``` env
VITE_API_URL=/api/v1
VITE_BACKEND_ORIGIN=http://localhost:8080
VITE_CURRENCY=INR
VITE_LOCALE=en-IN
```

Start Vite:

``` powershell
npm run dev
```

Open the local URL printed by Vite. The usual development URL is:

``` text
http://localhost:5173
```

Both the backend and frontend must remain running while using the
application.

## Development accounts

The sample database provides these development accounts:

  Role       Email                     Password
  ---------- ------------------------- ------------------
  Admin      `admin@technest.dev`      `Admin@12345`
  Customer   `customer@technest.dev`   `Customer@12345`

These accounts are for local demonstration and testing only. Do not use
them in production. Change or remove seeded accounts before deploying
the application.

Additional sample customers are included in the seed data. Refer to the
database seed migration for the exact records.

## Configuration

### Backend environment variables

The example file is `backend/.env.example`.

  -----------------------------------------------------------------------
  Variable                            Purpose
  ----------------------------------- -----------------------------------
  `DB_HOST`                           MySQL server host.

  `DB_PORT`                           MySQL server port.

  `DB_NAME`                           Application database name.

  `DB_USERNAME`                       Database username.

  `DB_PASSWORD`                       Database password.

  `JWT_SECRET`                        Secret used to sign and validate
                                      JWTs.

  `CORS_ALLOWED_ORIGINS`              Allowed frontend origin(s).

  `COOKIE_SECURE`                     Whether authentication cookies
                                      require HTTPS.

  `LOG_RESET_LINKS`                   Development option to write
                                      password-reset links to backend
                                      logs.
  -----------------------------------------------------------------------

### Frontend environment variables

The example file is `frontend/.env.example`.

  Variable                Purpose
  ----------------------- ---------------------------------------
  `VITE_API_URL`          API base path used by the frontend.
  `VITE_BACKEND_ORIGIN`   Backend origin for local development.
  `VITE_CURRENCY`         Currency display setting.
  `VITE_LOCALE`           Locale used for formatting.

Do not put passwords, private keys, or server secrets in frontend
environment variables. Values prefixed with `VITE_` are exposed in the
browser bundle.

## Database and migrations

TechNest uses MySQL 8 and Flyway.

-   `database/create_database.sql` --- database initialization script.
-   `database/migrations/` --- versioned schema and seed-data
    migrations.
-   `database/tools/` --- supporting database tools.
-   **V1 -- schema:** Creates application tables and database
    structures.
-   **V2 -- seed data:** Inserts sample catalogue and demonstration
    data.

Flyway checks migration history and applies pending migrations when the
backend starts. For schema changes, add a new migration rather than
manually modifying a Flyway-managed schema.

See `docs/DATABASE.md` for database details and relationships.

## API and documentation

The backend REST API is used by the customer storefront and admin
console.

  ------------------------------------------------------------------------------------
  Document                                         Contents
  ------------------------------------------------ -----------------------------------
  [`docs/API.md`](docs/API.md)                     API endpoints and request/response
                                                   information.

  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)   Application architecture and design
                                                   decisions.

  [`docs/DATABASE.md`](docs/DATABASE.md)           Database schema and relationships.

  [`docs/SETUP.md`](docs/SETUP.md)                 Additional setup and configuration
                                                   guidance.
  ------------------------------------------------------------------------------------

Local backend address: `http://localhost:8080`

The frontend API base path is configured as `/api/v1` in the example
frontend environment file. Refer to `docs/API.md` for endpoint details.

## Testing and build verification

### Backend tests

Run from `backend/`:

``` powershell
mvn clean test
```

**Verified locally:** 35 tests passed, with 0 failures, 0 errors, and 0
skipped.

### Frontend production build

Run from `frontend/`:

``` powershell
npm run build
```

**Verified locally:** Vite completed the production build successfully
and generated `frontend/dist/`.

### Backend executable package

Run from `backend/`:

``` powershell
mvn clean package -DskipTests
```

**Verified locally:** Maven generated:

``` text
backend/target/technest-backend-1.0.0.jar
```

The package command above skips tests; run `mvn clean test` separately
to execute them.

### Local verification summary

  Check                                Result
  ------------------------------------ ---------------------------------------
  Backend unit and integration tests   **35/35 passed**
  Spring Boot application startup      **Successful**
  MySQL 8 connection                   **Successful**
  Flyway migrations                    **2 migrations applied successfully**
  Frontend production build            **Successful**
  Backend Maven package                **Successful**
  Customer account workflow            **Opened and tested locally**
  Admin account workflow               **Opened and tested locally**
  GitHub source upload                 **Successful**

These results describe the local checks performed during development.
They do not mean that the application has been independently audited or
deployed to a production hosting environment.

## Business rules and demo behaviour

-   **Currency:** The storefront uses Indian Rupees (₹). `VITE_CURRENCY`
    and `VITE_LOCALE` control display formatting.
-   **Tax:** Product prices are tax-inclusive.
-   **Delivery:** Delivery is free on orders of ₹5,000 or more. Orders
    below that threshold have a flat ₹99 delivery fee.
-   **Sample catalogue:** Product entries, prices, reviews, and
    testimonials are illustrative, not official retail offers.
-   **Product images:** Sample images use external Unsplash URLs. A
    generated placeholder is available as a fallback; administrators can
    replace images or upload their own.
-   **Payments:** Online payments are simulated. No real payment gateway
    is connected and no real card payments are processed. The
    demonstration flow can mark an order paid with a `DEMO-` reference
    and includes a simulated declined-payment path.
-   **Password reset:** No email provider is configured. With the
    development logging option enabled, password-reset links are written
    to the backend log.
-   **Order status:** Order status transitions are guarded by backend
    business rules.

## Security considerations

The project includes security mechanisms, but it is an academic/demo
application and requires a separate security review before production
use.

-   Passwords are hashed using BCrypt.
-   JWT access tokens and rotating HttpOnly refresh cookies are used.
-   Customer and administrator permissions are enforced on the backend.
-   Ownership checks protect customer-specific resources.
-   Checkout and inventory operations include server-side controls.
-   Local environment files are excluded through `.gitignore`.

Before deployment:

1.  Replace all development passwords and sample accounts.
2.  Generate a strong, unique JWT secret.
3.  Configure HTTPS and secure cookies.
4.  Restrict CORS to the production frontend origin.
5.  Disable development password-reset link logging.
6.  Configure a real email provider if email workflows are required.
7.  Integrate and test a payment provider before accepting real
    payments.
8.  Review database permissions, logging, backups, rate limits, and
    deployment secrets.
9.  Never publish private environment files or production credentials.

## Troubleshooting

### MySQL connection refused

-   Confirm the MySQL 8 service is running.
-   Check the configured host and port.
-   Ensure `DB_PORT` matches the actual MySQL listening port.
-   Confirm the database exists and the configured user has access.

### MySQL access denied

-   Verify `DB_USERNAME` and `DB_PASSWORD` in your local backend
    configuration.
-   Confirm the MySQL user has privileges on `technest_db`.
-   Do not assume separate MySQL installations use the same root
    password.

### Backend does not start

Check Java and Maven:

``` powershell
java -version
mvn -version
```

Then run:

``` powershell
mvn clean test
```

Review the first root-cause exception in the backend terminal output.

### Frontend cannot reach the backend

-   Confirm Spring Boot is running on port `8080`.
-   Confirm Vite is running on port `5173`.
-   Check `VITE_API_URL`, `VITE_BACKEND_ORIGIN`, and backend CORS
    configuration.
-   Inspect browser developer tools for failed network requests.

### Port is already in use

Stop the conflicting process or change the relevant application port.
Keep the frontend API URL and backend CORS configuration consistent.

### Frontend dependency or build errors

From `frontend/`, try a clean dependency installation:

``` powershell
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

Avoid `npm audit fix --force` without reviewing the proposed changes
because it can introduce breaking dependency upgrades.

## Future enhancements

-   Email delivery for password resets and order updates.
-   Real payment gateway integration.
-   Coupon and discount-code support.
-   Saved payment tokens through a compliant payment provider.
-   Shared rate limiting using Redis.
-   Search-engine integration.
-   Image resizing and CDN delivery.
-   Product variants and advanced inventory management.
-   Returns and refunds workflow.
-   Expanded administrator audit logging.
-   Playwright end-to-end tests.
-   Continuous integration and automated deployment.

## Contributing

Suggestions and contributions are welcome.

1.  Fork the repository.
2.  Create a feature branch.
3.  Make your changes and add or update tests where appropriate.
4.  Run backend tests and the frontend production build.
5.  Commit with a descriptive message.
6.  Open a pull request describing the change.

Use the GitHub Issues section to report bugs or suggest features.

## License

No license has currently been specified for this repository. Without a
license, the source code is not automatically granted an open-source
reuse license.

------------------------------------------------------------------------

```{=html}
<p align="center">
```
`<strong>`{=html}TechNest --- Discover. Explore.
Shop.`</strong>`{=html}`<br>`{=html} Full-Stack Electronics E-Commerce
Web Application
```{=html}
</p>
```
