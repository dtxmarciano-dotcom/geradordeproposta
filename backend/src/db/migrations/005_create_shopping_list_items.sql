CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 3) NOT NULL DEFAULT 1
);

CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(list_id);
