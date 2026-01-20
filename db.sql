-- Adatbázis létrehozása
CREATE DATABASE IF NOT EXISTS retrogshop;
USE retrogshop;

-- -----------------------
-- Felhasználók tábla
-- -----------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('seller','admin') NOT NULL
);

-- Példa admin felhasználó
-- Jelszó: admin123
INSERT INTO users (username, password, role) VALUES (
    'admin',
    '$2y$10$QmH1uJzK8nblbEJ1aZtpbeZp8Oy7QH6qSgXKoM2pN7C0mVxpx5v5K',
    'admin'
);

-- -----------------------
-- Termékek tábla
-- -----------------------
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    image VARCHAR(255) NOT NULL,
    description TEXT
);

-- Példa termékek
INSERT INTO products (name, price, image, description) VALUES
('MSI Cyborg 15 Gaming Laptop', 499990, 'images/1416637426.msi-cyborg-15-a13vf-1816-9s7-15k111-1816.jpg', 'Erőteljes laptop játékhoz és munkához.'),
('RTX 4070 Ti Super Videókártya', 249990, 'images/res_c7cea2fd64f0ba2390b54ee1a4a0a5ec.png', 'Ultra gyors videókártya modern játékokhoz.'),
('Corsair Mechanikus billentyűzet', 39990, 'images/ProductImage_GATA-2679_01_06a58eb77a80f6c01476dedb8a28ebb3.jpg', 'Precíziós mechanikus billentyűzet gamer élményhez.');
