-- =============================================================================
-- Module: Products
-- Tables specifiques au module products
-- =============================================================================

\c app;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);

-- Sample data (dev only - remove in production)
INSERT INTO products (name, description, price, category) VALUES
    ('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'electronics'),
    ('Wireless Mouse', 'Ergonomic wireless mouse', 49.99, 'accessories'),
    ('USB-C Hub', '7-in-1 multiport hub', 79.99, 'accessories'),
    ('Monitor 27"', '4K IPS display', 449.99, 'electronics'),
    ('Mechanical Keyboard', 'RGB mechanical keyboard', 129.99, 'accessories')
ON CONFLICT DO NOTHING;
