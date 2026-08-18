export interface Product {
  id: string;
  supermarket_id: string;
  product_name: string;
  price: string;
  unit: string;
  updated_at: Date;
}

export interface ProductInput {
  product_name: string;
  price: number;
  unit: string;
}
