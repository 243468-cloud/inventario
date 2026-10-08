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
INSERT IGNORE INTO bulk_honey_inventory (id, current_stock_kg) VALUES (1, 0);

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

-- 12. RECETAS POR PRESENTACIÓN
CREATE TABLE IF NOT EXISTS recipe_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT NOT NULL,
    inventory_item_id INT NOT NULL,
    quantity_required DECIMAL(10,2) NOT NULL
);

-- ==============================================================================
-- CARGA DE INVENTARIO FÍSICO — 07 DE OCTUBRE 2026
-- ==============================================================================

-- A) ENVASES VACÍOS (CONTAINER)
-- Limpieza de envases anteriores (para evitar duplicados o registros desactualizados)
SET SQL_SAFE_UPDATES = 0;
DELETE FROM inventory_items 
WHERE id > 0 
  AND (category = 'CONTAINER' 
       OR name IN ('Envase 5 kg', 'Caja 30 gr (pza)', 'Envase 950 gr', 'Caja 330 gr (pza)', 
                   'Envase 30g', 'Envase 330g', 'Envase 950g', 'Hexagonal 12/260', 
                   'Frasco 48/1 OZ', 'Botella 12/360'));
SET SQL_SAFE_UPDATES = 1;

-- Desglose por Caja/Paquete y Piezas:
-- * Frasco 30 gr: 81 cajas x 48 pza = 3,888 piezas | $250.84 caja (-15%) -> $5.23 pza
-- * Frasco Hexagonal 330 gr: 23 cajas x 12 pza = 276 piezas | $170.03 caja (-15%) -> $14.17 pza
-- * Botella Cristal 500 gr: 15 cajas x 12 pza = 180 piezas | $109.75 caja (-15%) -> $9.15 pza
-- * Botella Licorera 950 gr: 5 paquetes x 136 pza = 680 piezas | $649.00 paq -> $4.77 pza
-- * Mini Galón 5 kg: 120 piezas
INSERT INTO inventory_items (name, category, unit, current_stock, cost_per_unit, min_stock, is_active) VALUES
('Frasco 30 gr (Caja c/48 pza)',          'CONTAINER', 'PIECE', 3888, 5.23,  0, true),
('Frasco Hexagonal 330 gr (Caja c/12 pza)', 'CONTAINER', 'PIECE', 276,  14.17, 0, true),
('Botella Cristal 500 gr (Caja c/12 pza)', 'CONTAINER', 'PIECE', 180,  9.15,  0, true),
('Botella Licorera 950 gr (Paq c/136 pza)', 'CONTAINER', 'PIECE', 680,  4.77,  0, true),
('Mini Galón 5 kg',                       'CONTAINER', 'PIECE', 120,  0.00,  0, true)
ON DUPLICATE KEY UPDATE 
    current_stock = VALUES(current_stock),
    cost_per_unit = VALUES(cost_per_unit);

-- B) MIEL Y SUS DERIVADOS (BULK_HONEY)
INSERT IGNORE INTO inventory_items (name, category, unit, current_stock, cost_per_unit, min_stock, is_active) VALUES
('Panal',                    'BULK_HONEY', 'PIECE',  0,    0.00, 0, true),
('Polen',                    'BULK_HONEY', 'PIECE',  4,    0.00, 0, true),
('Cubeta Miel Pura',         'BULK_HONEY', 'PIECE',  32,   0.00, 0, true),
('Galon Agave',              'BULK_HONEY', 'PIECE',  68.5, 0.00, 0, true),
('Cubeta Miel con Limon',    'BULK_HONEY', 'PIECE',  4,    0.00, 0, true),
('Cubeta Miel con Gengibre', 'BULK_HONEY', 'PIECE',  2,    0.00, 0, true),
('Cubeta Miel Exportacion',  'BULK_HONEY', 'PIECE',  24,   0.00, 0, true),
('Cubeta Miel con Polen',    'BULK_HONEY', 'PIECE',  3,    0.00, 0, true);

-- C) QUESOS (CHEESE)
INSERT IGNORE INTO inventory_items (name, category, unit, current_stock, cost_per_unit, min_stock, is_active) VALUES
('Queso Ocosingo',          'CHEESE', 'PIECE', 10, 0.00, 0, true),
('Queso Excelsior',         'CHEESE', 'PIECE',  1, 0.00, 0, true),
('Queso de Origen Vegetal', 'CHEESE', 'PIECE',  2, 0.00, 0, true),
('Queso Mantequilla',       'CHEESE', 'PIECE',  9, 0.00, 0, true);

-- D) EXTRAS (OTHER)
INSERT IGNORE INTO inventory_items (name, category, unit, current_stock, cost_per_unit, min_stock, is_active) VALUES
('Vinagre',    'OTHER', 'PIECE', 2,  0.00, 0, true),
('Granola',    'OTHER', 'PIECE', 0,  0.00, 0, true),
('San Marino', 'OTHER', 'PIECE', 11, 0.00, 0, true);

-- ==============================================================================
-- E) PRESENTACIONES DE PRODUCTO TERMINADO (14 PRESENTACIONES)
-- ==============================================================================
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;
DELETE FROM presentation_stock WHERE presentation_id > 0;
DELETE FROM presentations WHERE id > 0;
SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;

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
(14, '5 kg Miel normal',                5000.00, true, 0, 0.00);

-- Inicializar stock de presentaciones en 0
INSERT IGNORE INTO presentation_stock (presentation_id, current_stock) VALUES
(1, 0), (2, 0), (3, 0), (4, 0), (5, 0), (6, 0), (7, 0),
(8, 0), (9, 0), (10, 0), (11, 0), (12, 0), (13, 0), (14, 0);


