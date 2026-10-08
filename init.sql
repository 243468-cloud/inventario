-- ==============================================================================
-- SCRIPT DE INICIALIZACIÓN COMPLETO DE BASE DE DATOS
-- 100% compatible con MySQL 8.x / Aiven (defaultdb)
-- ==============================================================================

-- 1. PRESENTACIONES DE PRODUCTO TERMINADO
CREATE TABLE IF NOT EXISTS presentations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    weight_grams DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    min_stock INT DEFAULT 0,
    container_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    INDEX idx_presentations_active_weight (is_active, weight_grams)
);

-- 2. INVENTARIO A GRANEL HISTÓRICO
CREATE TABLE IF NOT EXISTS bulk_honey_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    current_stock_kg DECIMAL(10,2) NOT NULL DEFAULT 0
);
-- Inicializar con los 864 kg de miel a granel disponibles (32 cubetas de miel pura x 27 kg)
INSERT INTO bulk_honey_inventory (id, current_stock_kg) VALUES (1, 864.00)
ON DUPLICATE KEY UPDATE current_stock_kg = 864.00;

-- 3. STOCK DE PRESENTACIONES
CREATE TABLE IF NOT EXISTS presentation_stock (
    presentation_id INT PRIMARY KEY,
    current_stock INT NOT NULL DEFAULT 0,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id)
);

-- 4. COSTOS DE MATERIA PRIMA
CREATE TABLE IF NOT EXISTS raw_material_cost_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cost_per_kg DECIMAL(10,2) NOT NULL,
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_raw_material_cost_date (effective_date DESC)
);

-- 5. HISTORIAL DE PRECIOS DE VENTA
CREATE TABLE IF NOT EXISTS sale_price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT,
    sale_price DECIMAL(10,2) NOT NULL,
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id),
    INDEX idx_sale_price_history_presentation_date (presentation_id, effective_date DESC)
);

-- 6. LOTES DE PRODUCCIÓN
CREATE TABLE IF NOT EXISTS production_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT,
    quantity_produced INT NOT NULL,
    honey_used_kg DECIMAL(10,2) NOT NULL,
    production_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id),
    INDEX idx_production_batches_date (production_date DESC),
    INDEX idx_production_batches_presentation (presentation_id, production_date DESC)
);

-- 7. MOVIMIENTOS DE STOCK
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_type VARCHAR(50) NOT NULL,
    presentation_id INT,
    movement_type VARCHAR(10) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id INT,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id),
    INDEX idx_stock_movements_type_date (item_type, movement_date DESC),
    INDEX idx_stock_movements_presentation_date (presentation_id, movement_date DESC)
);

-- 8. USUARIOS
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'authenticated'
);

-- Usuario Administrador por defecto (Orion)
INSERT IGNORE INTO users (id, username, password_hash, role) 
VALUES (1, 'Orion', '$2a$12$KkQnZ38Gk9.wJ.o9gR4g3e.B0uV0z7s8hX4m9P6D9Xf0x/2T3B9Z.v', 'SUPER_ADMIN');

-- 9. NOTIFICACIONES PUSH
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(512) NOT NULL UNIQUE,
    p256dh VARCHAR(256) NOT NULL,
    auth VARCHAR(128) NOT NULL
);

-- 10. ALMACÉN Y MATERIA PRIMA (inventory_items)
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    min_stock DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE KEY uq_inventory_items_name (name)
);

-- Limpieza de duplicados si ya existen (ejecuta antes de los INSERTs)
DELETE t1 FROM inventory_items t1
    INNER JOIN inventory_items t2
    WHERE t1.id > t2.id AND t1.name = t2.name;

-- 11. ENTRADAS DE ALMACÉN
CREATE TABLE IF NOT EXISTS purchase_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_item_id INT NOT NULL,
    format_type VARCHAR(50) NOT NULL,
    format_quantity DECIMAL(10,2) NOT NULL,
    total_base_quantity DECIMAL(10,2) NOT NULL,
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. SALIDAS DE ALMACÉN
CREATE TABLE IF NOT EXISTS inventory_exits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_item_id INT NOT NULL,
    format_type VARCHAR(50) NOT NULL,
    format_quantity DECIMAL(10,2) NOT NULL,
    total_base_quantity DECIMAL(10,2) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    notes VARCHAR(255),
    exit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. RECETAS POR PRESENTACIÓN
CREATE TABLE IF NOT EXISTS recipe_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT NOT NULL,
    inventory_item_id INT NOT NULL,
    quantity_required DECIMAL(10,2) NOT NULL
);

-- ==============================================================================
-- CARGA DE INVENTARIO FÍSICO VERIFICADO — 07 DE OCTUBRE 2026
-- ==============================================================================
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- 1. LIMPIEZA TOTAL DE INVENTARIO PREVIO
DELETE FROM recipe_items WHERE id > 0;
DELETE FROM presentation_stock WHERE presentation_id > 0;
DELETE FROM inventory_items WHERE id > 0;

-- 2. INVENTARIO A GRANEL HISTÓRICO (32 cubetas x 24.500 kg netos = 784.00 kg)
INSERT INTO bulk_honey_inventory (id, current_stock_kg) VALUES (1, 784.00)
ON DUPLICATE KEY UPDATE current_stock_kg = 784.00;

-- 3. ALMACÉN Y MATERIA PRIMA (inventory_items)
INSERT INTO inventory_items (name, category, unit, current_stock, cost_per_unit, min_stock, is_active) VALUES
-- A) ENVASES VACÍOS (CONTAINER)
('Frasco 30 gr (Caja c/48 pza)',          'CONTAINER', 'PIECE', 3888, 5.23,  0, true), -- 81 cajas x 48 pza
('Frasco Hexagonal 330 gr (Caja c/12 pza)', 'CONTAINER', 'PIECE', 276,  14.17, 0, true), -- 23 cajas x 12 pza
('Botella Cristal 500 gr (Caja c/12 pza)', 'CONTAINER', 'PIECE', 156,  9.15,  0, true), -- 13 cajas x 12 pza
('Botella Licorera 950 gr (Paq c/136 pza)', 'CONTAINER', 'PIECE', 680,  4.77,  0, true), -- 5 paqs x 136 pza
('Mini Galón 5 kg',                       'CONTAINER', 'PIECE', 120,  0.00,  0, true), -- 120 envases

-- B) MIEL Y SUS DERIVADOS (BULK_HONEY)
('Cubeta Miel Pura',               'BULK_HONEY', 'PIECE', 32,   0.00, 0, true), -- 24.500 kg neto c/u
('Galon Agave',                    'BULK_HONEY', 'PIECE', 68.5, 0.00, 0, true), -- 25.000 kg neto c/u
('Panal',                          'BULK_HONEY', 'PIECE',  0,   0.00, 0, true),
('Polen',                          'BULK_HONEY', 'PIECE',  4,   0.00, 0, true),
('Cubeta Miel con Limon',          'BULK_HONEY', 'PIECE',  4,   0.00, 0, true),
('Cubeta Miel con Limon y Gengibre','BULK_HONEY', 'PIECE',  1,   0.00, 0, true),
('Cubeta Miel con Gengibre',       'BULK_HONEY', 'PIECE',  2,   0.00, 0, true),
('Cubeta Miel con Polen',          'BULK_HONEY', 'PIECE',  1,   0.00, 0, true),

-- C) QUESOS (CHEESE)
('Queso Ocosingo',          'CHEESE', 'PIECE', 10, 0.00, 0, true),
('Queso Mantequilla',       'CHEESE', 'PIECE',  9, 0.00, 0, true),
('Queso Excelsior',         'CHEESE', 'PIECE',  1, 0.00, 0, true),
('Queso de Origen Vegetal', 'CHEESE', 'PIECE',  2, 0.00, 0, true),

-- D) EXTRAS (OTHER)
('Vinagre',           'OTHER', 'PIECE',  3, 0.00, 0, true), -- 3 litros
('Granola',           'OTHER', 'PIECE',  2, 0.00, 0, true), -- 2 bolsas (1 kg)
('Xtabentún (1.5 L)', 'OTHER', 'PIECE', 11, 0.00, 0, true); -- 11 botellas

-- 4. PRESENTACIONES DE PRODUCTO TERMINADO (14 PRESENTACIONES)
INSERT INTO presentations (id, name, weight_grams, is_active, min_stock, container_cost) VALUES
(1,  '30 gr Miel normal',               30.00,   true, 0, 5.23),
(2,  '30 gr Miel de melipona',          30.00,   true, 0, 5.23),
(3,  '50 gr Miel normal',               50.00,   true, 0, 0.00),
(4,  '50 gr Miel con limon',            50.00,   true, 0, 0.00),
(5,  '50 gr Miel con gengibre',         50.00,   true, 0, 0.00),
(6,  '50 gr Miel con Limon/gengibre',   50.00,   true, 0, 0.00),
(7,  '330 gr Miel normal',              330.00,  true, 0, 14.17),
(8,  '330 gr Miel con limon',           330.00,  true, 0, 14.17),
(9,  '330 gr Miel con gengibre',        330.00,  true, 0, 14.17),
(10, '330 gr Miel con Limon/gengibre',  330.00,  true, 0, 14.17),
(11, '500 gr Miel normal',              500.00,  true, 0, 9.15),
(12, '950 gr Miel normal',              950.00,  true, 0, 4.77),
(13, '950 gr Miel Agave',               950.00,  true, 0, 4.77),
(14, '5 kg Miel normal',                5000.00, true, 0, 0.00)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    weight_grams = VALUES(weight_grams),
    container_cost = VALUES(container_cost),
    is_active = true;

-- 5. STOCK DE PRESENTACIONES (STOCK FÍSICO VERIFICADO)
INSERT INTO presentation_stock (presentation_id, current_stock, empty_stock) VALUES
(1,  0,  0),
(2,  0,  0),
(3,  0,  0),
(4,  0,  0),
(5,  0,  0),
(6,  0,  0),
(7,  0,  0),
(8,  0,  0),
(9,  0,  0),
(10, 0,  0),
(11, 0,  0),
(12, 25, 0), -- 25 piezas verificadas
(13, 15, 0), -- 15 piezas verificadas
(14, 3,  0)  -- 3 piezas verificadas
ON DUPLICATE KEY UPDATE current_stock = VALUES(current_stock);

-- 6. VINCULACIÓN DE RECETAS POR PRESENTACIÓN (RECIPE_ITEMS)
-- 1. Frasco 30 gr Miel normal
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 1, id, 1.00 FROM inventory_items WHERE name = 'Frasco 30 gr (Caja c/48 pza)' LIMIT 1;
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 1, id, 0.030 FROM inventory_items WHERE name = 'Cubeta Miel Pura' LIMIT 1;

-- 2. Frasco 30 gr Miel de melipona
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 2, id, 1.00 FROM inventory_items WHERE name = 'Frasco 30 gr (Caja c/48 pza)' LIMIT 1;

-- 7. 330 gr Miel normal
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 7, id, 1.00 FROM inventory_items WHERE name = 'Frasco Hexagonal 330 gr (Caja c/12 pza)' LIMIT 1;
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 7, id, 0.330 FROM inventory_items WHERE name = 'Cubeta Miel Pura' LIMIT 1;

-- 8. 330 gr Miel con limón
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 8, id, 1.00 FROM inventory_items WHERE name = 'Frasco Hexagonal 330 gr (Caja c/12 pza)' LIMIT 1;
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 8, id, 0.330 FROM inventory_items WHERE name = 'Cubeta Miel con Limon' LIMIT 1;

-- 9. 330 gr Miel con jengibre
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 9, id, 1.00 FROM inventory_items WHERE name = 'Frasco Hexagonal 330 gr (Caja c/12 pza)' LIMIT 1;
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 9, id, 0.330 FROM inventory_items WHERE name = 'Cubeta Miel con Gengibre' LIMIT 1;

-- 10. 330 gr Miel con Limón/jengibre
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 10, id, 1.00 FROM inventory_items WHERE name = 'Frasco Hexagonal 330 gr (Caja c/12 pza)' LIMIT 1;
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 10, id, 0.330 FROM inventory_items WHERE name = 'Cubeta Miel con Limon y Gengibre' LIMIT 1;

-- 11. 500 gr Miel normal
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 11, id, 1.00 FROM inventory_items WHERE name = 'Botella Cristal 500 gr (Caja c/12 pza)' LIMIT 1;
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 11, id, 0.500 FROM inventory_items WHERE name = 'Cubeta Miel Pura' LIMIT 1;

-- 12. 950 gr Miel normal
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 12, id, 1.00 FROM inventory_items WHERE name = 'Botella Licorera 950 gr (Paq c/136 pza)' LIMIT 1;
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 12, id, 0.950 FROM inventory_items WHERE name = 'Cubeta Miel Pura' LIMIT 1;

-- 13. 950 gr Miel Agave
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 13, id, 1.00 FROM inventory_items WHERE name = 'Botella Licorera 950 gr (Paq c/136 pza)' LIMIT 1;
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 13, id, 0.950 FROM inventory_items WHERE name = 'Galon Agave' LIMIT 1;

-- 14. 5 kg Miel normal
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 14, id, 1.00 FROM inventory_items WHERE name = 'Mini Galón 5 kg' LIMIT 1;
INSERT INTO recipe_items (presentation_id, inventory_item_id, quantity_required)
SELECT 14, id, 5.000 FROM inventory_items WHERE name = 'Cubeta Miel Pura' LIMIT 1;

SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;



