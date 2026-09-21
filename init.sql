-- TABLAS PARA MYSQL
CREATE DATABASE IF NOT EXISTS miel_db;
USE miel_db;

CREATE TABLE presentations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    weight_grams DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    min_stock INT DEFAULT 0,
    container_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00
);
-- Índice para buscar presentaciones activas y ordenar por peso más rápido
CREATE INDEX idx_presentations_active_weight ON presentations(is_active, weight_grams);

CREATE TABLE bulk_honey_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    current_stock_kg DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- Iniciar con 0 kg
INSERT INTO bulk_honey_inventory (id, current_stock_kg) VALUES (1, 0);

CREATE TABLE presentation_stock (
    presentation_id INT PRIMARY KEY,
    current_stock INT NOT NULL DEFAULT 0,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id)
);

CREATE TABLE raw_material_cost_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cost_per_kg DECIMAL(10,2) NOT NULL,
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Índice para obtener rápidamente el costo más reciente
CREATE INDEX idx_raw_material_cost_date ON raw_material_cost_history(effective_date DESC);

CREATE TABLE sale_price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT,
    sale_price DECIMAL(10,2) NOT NULL,
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id)
);
-- Índice compuesto (presentation_id + effective_date) muy útil para sacar el último precio por presentación
CREATE INDEX idx_sale_price_history_presentation_date ON sale_price_history(presentation_id, effective_date DESC);

CREATE TABLE production_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT,
    quantity_produced INT NOT NULL,
    honey_used_kg DECIMAL(10,2) NOT NULL,
    production_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id)
);
-- Índices para reportes de producción por fecha y/o presentación
CREATE INDEX idx_production_batches_date ON production_batches(production_date DESC);
CREATE INDEX idx_production_batches_presentation ON production_batches(presentation_id, production_date DESC);

CREATE TABLE stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_type VARCHAR(50) NOT NULL, -- 'BULK_HONEY', 'PRESENTATION'
    presentation_id INT, -- Null para BULK_HONEY
    movement_type VARCHAR(10) NOT NULL, -- 'IN', 'OUT'
    quantity DECIMAL(10,2) NOT NULL, -- kg para miel, unidades para presentaciones
    reference_type VARCHAR(50) NOT NULL, -- 'PRODUCTION_BATCH', 'MANUAL_ADJUSTMENT'
    reference_id INT,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id)
);
-- Índices clave para los reportes de balance general (historial de movimientos)
CREATE INDEX idx_stock_movements_type_date ON stock_movements(item_type, movement_date DESC);
CREATE INDEX idx_stock_movements_presentation_date ON stock_movements(presentation_id, movement_date DESC);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'authenticated'
);
-- El username ya tiene un constraint UNIQUE, lo que automáticamente crea un índice, no se necesita crear otro adicional para login.

-- Insert default admin user (username: admin, password: admin)
-- Hash generated via BCrypt (strength 12) actualizado para producción
INSERT INTO users (username, password_hash, role) VALUES ('admin', '$2a$12$KkQnZ38Gk9.wJ.o9gR4g3e.B0uV0z7s8hX4m9P6D9Xf0x/2T3B9Z.v', 'SUPER_ADMIN');
