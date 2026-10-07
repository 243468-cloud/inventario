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
    is_active BOOLEAN NOT NULL DEFAULT true
);

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
INSERT INTO inventory_items (name, category, unit, current_stock, cost_per_unit, min_stock, is_active) VALUES
('Envase 5 kg',          'CONTAINER', 'PIECE', 120,   0.00, 0, true),
('Caja 30 gr (pza)',     'CONTAINER', 'PIECE', 3888,  0.00, 0, true),
('Envase 950 gr',        'CONTAINER', 'PIECE', 680,   0.00, 0, true),
('Caja 330 gr (pza)',    'CONTAINER', 'PIECE', 276,   0.00, 0, true);

-- B) MIEL Y SUS DERIVADOS (BULK_HONEY)
INSERT INTO inventory_items (name, category, unit, current_stock, cost_per_unit, min_stock, is_active) VALUES
('Panal',                    'BULK_HONEY', 'PIECE',  0,    0.00, 0, true),
('Polen',                    'BULK_HONEY', 'PIECE',  4,    0.00, 0, true),
('Cubeta Miel Pura',         'BULK_HONEY', 'PIECE',  32,   0.00, 0, true),
('Galon Agave',              'BULK_HONEY', 'PIECE',  68.5, 0.00, 0, true),
('Cubeta Miel con Limon',    'BULK_HONEY', 'PIECE',  4,    0.00, 0, true),
('Cubeta Miel con Gengibre', 'BULK_HONEY', 'PIECE',  2,    0.00, 0, true),
('Cubeta Miel Exportacion',  'BULK_HONEY', 'PIECE',  24,   0.00, 0, true),
('Cubeta Miel con Polen',    'BULK_HONEY', 'PIECE',  3,    0.00, 0, true);

-- C) QUESOS (CHEESE)
INSERT INTO inventory_items (name, category, unit, current_stock, cost_per_unit, min_stock, is_active) VALUES
('Queso Ocosingo',          'CHEESE', 'PIECE', 10, 0.00, 0, true),
('Queso Excelsior',         'CHEESE', 'PIECE',  1, 0.00, 0, true),
('Queso de Origen Vegetal', 'CHEESE', 'PIECE',  2, 0.00, 0, true),
('Queso Mantequilla',       'CHEESE', 'PIECE',  9, 0.00, 0, true);

-- D) EXTRAS (OTHER)
INSERT INTO inventory_items (name, category, unit, current_stock, cost_per_unit, min_stock, is_active) VALUES
('Vinagre',    'OTHER', 'PIECE', 2,  0.00, 0, true),
('Granola',    'OTHER', 'PIECE', 0,  0.00, 0, true),
('San Marino', 'OTHER', 'PIECE', 11, 0.00, 0, true);
