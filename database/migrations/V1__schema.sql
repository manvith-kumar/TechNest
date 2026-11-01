-- TechNest schema (MySQL 8+). Managed by Flyway. Hibernate runs with ddl-auto=none.
SET NAMES utf8mb4;

CREATE TABLE users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  phone         VARCHAR(20) NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER',
  enabled       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT ck_users_role CHECK (role IN ('CUSTOMER','ADMIN'))
) ENGINE=InnoDB;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created ON users(created_at);

CREATE TABLE refresh_tokens (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  revoked    TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_refresh_hash UNIQUE (token_hash),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

CREATE TABLE password_reset_tokens (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  used       TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_reset_hash UNIQUE (token_hash),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE categories (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  image_url   VARCHAR(1000) NULL,
  created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_categories_name UNIQUE (name),
  CONSTRAINT uq_categories_slug UNIQUE (slug)
) ENGINE=InnoDB;

CREATE TABLE products (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_id         BIGINT NOT NULL,
  name                VARCHAR(200) NOT NULL,
  slug                VARCHAR(220) NOT NULL,
  brand               VARCHAR(80)  NOT NULL,
  description         TEXT NOT NULL,
  price               DECIMAL(12,2) NOT NULL,
  discount_price      DECIMAL(12,2) NULL,
  effective_price     DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(discount_price, price)) STORED,
  stock_quantity      INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  featured            TINYINT(1) NOT NULL DEFAULT 0,
  active              TINYINT(1) NOT NULL DEFAULT 1,
  rating_avg          DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count        INT NOT NULL DEFAULT 0,
  sold_count          INT NOT NULL DEFAULT 0,
  created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_products_slug UNIQUE (slug),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT ck_products_price CHECK (price > 0),
  CONSTRAINT ck_products_discount CHECK (discount_price IS NULL OR (discount_price > 0 AND discount_price < price)),
  CONSTRAINT ck_products_stock CHECK (stock_quantity >= 0),
  CONSTRAINT ck_products_rating CHECK (rating_avg >= 0 AND rating_avg <= 5)
) ENGINE=InnoDB;
CREATE INDEX idx_products_category ON products(category_id, active);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_effective_price ON products(effective_price);
CREATE INDEX idx_products_featured ON products(featured, active);
CREATE INDEX idx_products_created ON products(created_at);
CREATE INDEX idx_products_sold ON products(sold_count);
CREATE INDEX idx_products_name ON products(name);

CREATE TABLE product_images (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  url        VARCHAR(1000) NOT NULL,
  alt_text   VARCHAR(200) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_pimg_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_pimg_product ON product_images(product_id, sort_order);

CREATE TABLE product_specifications (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  spec_key   VARCHAR(100) NOT NULL,
  spec_value VARCHAR(300) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_pspec_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_pspec_product ON product_specifications(product_id, sort_order);

CREATE TABLE carts (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_carts_user UNIQUE (user_id),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  cart_id    BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity   INT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id),
  CONSTRAINT fk_citems_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_citems_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT ck_citems_qty CHECK (quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE wishlists (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_wishlist UNIQUE (user_id, product_id),
  CONSTRAINT fk_wish_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wish_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE addresses (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id        BIGINT NOT NULL,
  label          VARCHAR(40) NOT NULL DEFAULT 'Home',
  recipient_name VARCHAR(120) NOT NULL,
  phone          VARCHAR(20) NOT NULL,
  line1          VARCHAR(200) NOT NULL,
  line2          VARCHAR(200) NULL,
  city           VARCHAR(100) NOT NULL,
  state          VARCHAR(100) NOT NULL,
  postal_code    VARCHAR(12) NOT NULL,
  country        VARCHAR(80) NOT NULL DEFAULT 'India',
  is_default     TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_addr_user ON addresses(user_id);

CREATE TABLE orders (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_number    VARCHAR(30) NOT NULL,
  user_id         BIGINT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PLACED',
  subtotal        DECIMAL(12,2) NOT NULL,
  discount_total  DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_fee    DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount    DECIMAL(12,2) NOT NULL,
  ship_name       VARCHAR(120) NOT NULL,
  ship_phone      VARCHAR(20)  NOT NULL,
  ship_line1      VARCHAR(200) NOT NULL,
  ship_line2      VARCHAR(200) NULL,
  ship_city       VARCHAR(100) NOT NULL,
  ship_state      VARCHAR(100) NOT NULL,
  ship_postal     VARCHAR(12)  NOT NULL,
  ship_country    VARCHAR(80)  NOT NULL,
  idempotency_key VARCHAR(80) NULL,
  stock_restored  TINYINT(1) NOT NULL DEFAULT 0,
  placed_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_orders_number UNIQUE (order_number),
  CONSTRAINT uq_orders_idem UNIQUE (user_id, idempotency_key),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT ck_orders_status CHECK (status IN ('PLACED','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED')),
  CONSTRAINT ck_orders_total CHECK (total_amount >= 0)
) ENGINE=InnoDB;
CREATE INDEX idx_orders_user ON orders(user_id, placed_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_placed ON orders(placed_at);

CREATE TABLE order_items (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id        BIGINT NOT NULL,
  product_id      BIGINT NOT NULL,
  product_name    VARCHAR(200) NOT NULL,
  product_image   VARCHAR(1000) NULL,
  unit_price      DECIMAL(12,2) NOT NULL,
  original_price  DECIMAL(12,2) NOT NULL,
  quantity        INT NOT NULL,
  line_total      DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_oitems_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oitems_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT ck_oitems_qty CHECK (quantity > 0)
) ENGINE=InnoDB;
CREATE INDEX idx_oitems_order ON order_items(order_id);
CREATE INDEX idx_oitems_product ON order_items(product_id);

CREATE TABLE order_status_history (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id   BIGINT NOT NULL,
  status     VARCHAR(20) NOT NULL,
  note       VARCHAR(300) NULL,
  changed_by BIGINT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_osh_order ON order_status_history(order_id, created_at);

CREATE TABLE payments (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id        BIGINT NOT NULL,
  method          VARCHAR(20) NOT NULL,
  status          VARCHAR(20) NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  transaction_ref VARCHAR(60) NULL,
  simulated       TINYINT(1) NOT NULL DEFAULT 1,
  paid_at         DATETIME(6) NULL,
  created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_payments_order UNIQUE (order_id),
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT ck_pay_method CHECK (method IN ('COD','DEMO_ONLINE')),
  CONSTRAINT ck_pay_status CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED','CANCELLED'))
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  user_id    BIGINT NOT NULL,
  rating     TINYINT NOT NULL,
  title      VARCHAR(150) NULL,
  comment    TEXT NULL,
  reported   TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_review_user_product UNIQUE (user_id, product_id),
  CONSTRAINT fk_rev_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_rev_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;
CREATE INDEX idx_rev_product ON reviews(product_id, created_at);
CREATE INDEX idx_rev_reported ON reviews(reported);

CREATE TABLE inventory_adjustments (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id     BIGINT NOT NULL,
  delta          INT NOT NULL,
  quantity_after INT NOT NULL,
  reason         VARCHAR(30) NOT NULL,
  note           VARCHAR(300) NULL,
  order_id       BIGINT NULL,
  created_by     BIGINT NULL,
  created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_inv_product ON inventory_adjustments(product_id, created_at);

CREATE TABLE newsletter_subscribers (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(190) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_newsletter_email UNIQUE (email)
) ENGINE=InnoDB;
