import { pool } from "../db/pool";
import { ShoppingList, ShoppingListItem } from "../models/shoppingList";

export interface ShoppingListWithCount extends ShoppingList {
  item_count: number;
}

export async function listShoppingListsForUser(userId: string): Promise<ShoppingListWithCount[]> {
  const result = await pool.query<ShoppingListWithCount>(
    `SELECT sl.*, COUNT(sli.id)::int AS item_count
     FROM shopping_lists sl
     LEFT JOIN shopping_list_items sli ON sli.list_id = sl.id
     WHERE sl.user_id = $1
     GROUP BY sl.id
     ORDER BY sl.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function findShoppingListById(id: string): Promise<ShoppingList | null> {
  const result = await pool.query<ShoppingList>("SELECT * FROM shopping_lists WHERE id = $1", [
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function createShoppingList(input: {
  userId: string;
  title: string | null;
}): Promise<ShoppingList> {
  const result = await pool.query<ShoppingList>(
    `INSERT INTO shopping_lists (user_id, title) VALUES ($1, $2) RETURNING *`,
    [input.userId, input.title]
  );
  return result.rows[0];
}

export async function updateShoppingListTitle(
  id: string,
  title: string
): Promise<ShoppingList | null> {
  const result = await pool.query<ShoppingList>(
    `UPDATE shopping_lists SET title = $2 WHERE id = $1 RETURNING *`,
    [id, title]
  );
  return result.rows[0] ?? null;
}

export async function deleteShoppingList(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM shopping_lists WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listItemsForList(listId: string): Promise<ShoppingListItem[]> {
  const result = await pool.query<ShoppingListItem>(
    "SELECT * FROM shopping_list_items WHERE list_id = $1 ORDER BY id ASC",
    [listId]
  );
  return result.rows;
}

export async function findItemById(
  listId: string,
  itemId: string
): Promise<ShoppingListItem | null> {
  const result = await pool.query<ShoppingListItem>(
    "SELECT * FROM shopping_list_items WHERE id = $1 AND list_id = $2",
    [itemId, listId]
  );
  return result.rows[0] ?? null;
}

export async function createItem(input: {
  listId: string;
  productName: string;
  quantity: number;
}): Promise<ShoppingListItem> {
  const result = await pool.query<ShoppingListItem>(
    `INSERT INTO shopping_list_items (list_id, product_name, quantity)
     VALUES ($1, $2, $3) RETURNING *`,
    [input.listId, input.productName, input.quantity]
  );
  return result.rows[0];
}

export async function createItems(
  listId: string,
  items: { productName: string; quantity: number }[]
): Promise<ShoppingListItem[]> {
  const created: ShoppingListItem[] = [];
  for (const item of items) {
    created.push(await createItem({ listId, productName: item.productName, quantity: item.quantity }));
  }
  return created;
}

export async function updateItem(
  listId: string,
  itemId: string,
  input: { productName?: string; quantity?: number }
): Promise<ShoppingListItem | null> {
  const result = await pool.query<ShoppingListItem>(
    `UPDATE shopping_list_items
     SET product_name = COALESCE($3, product_name),
         quantity = COALESCE($4, quantity)
     WHERE id = $1 AND list_id = $2
     RETURNING *`,
    [itemId, listId, input.productName ?? null, input.quantity ?? null]
  );
  return result.rows[0] ?? null;
}

export async function deleteItem(listId: string, itemId: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM shopping_list_items WHERE id = $1 AND list_id = $2",
    [itemId, listId]
  );
  return (result.rowCount ?? 0) > 0;
}
