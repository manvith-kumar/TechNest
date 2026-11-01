-- Run once as a MySQL administrator (e.g. root). Change the password before using it anywhere shared.
CREATE DATABASE IF NOT EXISTS technest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'technest'@'localhost' IDENTIFIED BY 'change_me_dev_only';
GRANT ALL PRIVILEGES ON technest_db.* TO 'technest'@'localhost';
-- Integration tests use a separate schema so they never touch development data.
CREATE DATABASE IF NOT EXISTS technest_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON technest_test.* TO 'technest'@'localhost';
FLUSH PRIVILEGES;
