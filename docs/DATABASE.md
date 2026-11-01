# Database design

MySQL 8, database `technest_db`, InnoDB, `utf8mb4`. The schema is owned by Flyway migrations in `database/migrations`; Hibernate runs with `ddl-auto=none`.

* `V1__schema.sql` - tables, constraints, indexes
* `V2__seed_data.sql` - **sample data only**, produced by `database/tools/generate_seed.py` (deterministic; regenerate with `python3 database/tools/generate_seed.py`)

## Tables (17)
| Table | Purpose | Key constraints |
|---|---|---|
| `users` | Customers and admins | unique `email`; `role` CHECK in (CUSTOMER, ADMIN); BCrypt `password_hash` |
| `refresh_tokens` | Rotating refresh sessions | only the SHA-256 of the token is stored; unique hash; FK users (cascade) |
| `password_reset_tokens` | One-hour single-use reset links | SHA-256 hash only |
| `categories` | Catalogue grouping | unique name and slug |
| `products` | Catalogue items | FK category; CHECK price > 0, discount < price, stock >= 0, rating 0..5; **generated column** `effective_price = COALESCE(discount_price, price)` |
| `product_images` / `product_specifications` | Gallery and spec rows | FK product (cascade), `sort_order` |
| `carts` / `cart_items` | One persisted cart per user | unique `user_id`; unique `(cart_id, product_id)`; CHECK quantity > 0 |
| `wishlists` | Saved products | unique `(user_id, product_id)` |
| `addresses` | Delivery addresses | FK user (cascade) |
| `orders` | Order header + **shipping address snapshot** | unique `order_number`; unique `(user_id, idempotency_key)`; status CHECK; `stock_restored` flag |
| `order_items` | Purchase-time snapshot: name, image, unit price, original price, quantity | FK product (RESTRICT) |
| `order_status_history` | Timeline for tracking | FK order (cascade) |
| `payments` | One per order | unique `order_id`; method CHECK (COD, DEMO_ONLINE); `simulated` flag |
| `reviews` | Ratings and text | unique `(user_id, product_id)`; CHECK rating 1..5; `reported` flag |
| `inventory_adjustments` | Stock audit trail | reason, delta, quantity_after, order_id |
| `newsletter_subscribers` | Email list | unique email |

## Relationships
User 1-N addresses, orders, reviews, wishlist rows; User 1-1 cart; Cart 1-N cart_items; Category 1-N products; Product 1-N images, specifications, reviews; Order 1-N order_items, status history; Order 1-1 payment.

## Design decisions
* **Money** is `DECIMAL(12,2)` and `BigDecimal` in Java. No floating point anywhere.
* **Snapshots**: orders copy the shipping address and each item's name, image and price, so later edits or deletions never rewrite history.
* **Stock safety**: the backend decrements with one atomic statement, `UPDATE products SET stock_quantity = stock_quantity - :qty WHERE id = :id AND stock_quantity >= :qty`, and treats "0 rows updated" as insufficient stock. The `ck_products_stock` constraint is a second line of defence. Order rows are locked (`SELECT ... FOR UPDATE`) during cancellation and status changes, and `stock_restored` guarantees stock is restored at most once.
* **Idempotent checkout**: the client sends an idempotency key; `(user_id, idempotency_key)` is unique, so a double-submit returns the first order instead of creating a second.
* **Indexes** cover category + active, brand, effective price, featured, created date, sold count, order lookups by user/status/date, and FK columns.
* **Deleting products**: a product that appears in any order cannot be deleted (FK RESTRICT); the API deactivates it instead.

## Seed data (sample only)
8 categories, 38 products from Apple, Samsung, Sony, Dell, HP, Lenovo, ASUS, Logitech, JBL and OnePlus with 3 images and 6 specifications each, 7 users (1 admin, 1 deactivated demo customer), 58 historical orders across 6 months in every status with matching payments and status history, and reviews only from customers whose order was delivered. Rating aggregates, totals and statuses are internally consistent (checked by SQL after loading). **Prices are illustrative, not official retail prices.**
