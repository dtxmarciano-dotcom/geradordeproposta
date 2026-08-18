export interface ShoppingList {
  id: string;
  user_id: string;
  title: string | null;
  created_at: Date;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  product_name: string;
  quantity: string;
}
