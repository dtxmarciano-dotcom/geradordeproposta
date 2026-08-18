CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supermarket_id UUID NOT NULL REFERENCES supermarkets(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_supermarket_id ON products(supermarket_id);
CREATE INDEX idx_products_product_name ON products(product_name);
