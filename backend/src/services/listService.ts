import {
  createItem,
  createItems,
  createShoppingList,
  deleteItem,
  deleteShoppingList,
  findItemById,
  findShoppingListById,
  listItemsForList,
  listShoppingListsForUser,
  ShoppingListWithCount,
  updateItem,
  updateShoppingListTitle,
} from "../repositories/shoppingListRepository";
import { listAllProducts } from "../repositories/productRepository";
import { listSupermarkets } from "../repositories/supermarketRepository";
import { ShoppingList, ShoppingListItem } from "../models/shoppingList";
import { compareShoppingList, ComparisonProduct, ComparisonResult } from "./comparisonService";

export class ListNotFoundError extends Error {
  constructor() {
    super("Shopping list not found");
    this.name = "ListNotFoundError";
  }
}

export class ItemNotFoundError extends Error {
  constructor() {
    super("Item not found");
    this.name = "ItemNotFoundError";
  }
}

function defaultTitle(): string {
  return `Minha lista de ${new Date().toLocaleDateString("pt-BR")}`;
}

export async function getListsForUser(userId: string): Promise<ShoppingListWithCount[]> {
  return listShoppingListsForUser(userId);
}

// Garante que a lista existe E pertence ao usuário do token. Retorna 404
// (via ListNotFoundError) em ambos os casos, para não vazar se a lista
// existe mas é de outra pessoa.
export async function getOwnedListOrThrow(listId: string, userId: string): Promise<ShoppingList> {
  const list = await findShoppingListById(listId);
  if (!list || list.user_id !== userId) {
    throw new ListNotFoundError();
  }
  return list;
}

export async function createListForUser(
  userId: string,
  title: string | null
): Promise<ShoppingList> {
  return createShoppingList({ userId, title: title && title.trim() ? title.trim() : defaultTitle() });
}

export async function getListDetail(
  listId: string,
  userId: string
): Promise<{ list: ShoppingList; items: ShoppingListItem[] }> {
  const list = await getOwnedListOrThrow(listId, userId);
  const items = await listItemsForList(listId);
  return { list, items };
}

export async function renameList(
  listId: string,
  userId: string,
  title: string
): Promise<ShoppingList> {
  await getOwnedListOrThrow(listId, userId);
  const updated = await updateShoppingListTitle(listId, title.trim());
  if (!updated) throw new ListNotFoundError();
  return updated;
}

export async function removeList(listId: string, userId: string): Promise<void> {
  await getOwnedListOrThrow(listId, userId);
  const deleted = await deleteShoppingList(listId);
  if (!deleted) throw new ListNotFoundError();
}

export interface ItemInput {
  product_name: string;
  quantity?: number;
}

export async function addItems(
  listId: string,
  userId: string,
  input: ItemInput | ItemInput[]
): Promise<ShoppingListItem[]> {
  await getOwnedListOrThrow(listId, userId);
  const rawItems = Array.isArray(input) ? input : [input];
  const items = rawItems.map((item) => ({
    productName: item.product_name.trim(),
    quantity: item.quantity ?? 1,
  }));

  if (items.length === 1) {
    return [await createItem({ listId, ...items[0] })];
  }
  return createItems(listId, items);
}

export async function editItem(
  listId: string,
  userId: string,
  itemId: string,
  input: { product_name?: string; quantity?: number }
): Promise<ShoppingListItem> {
  await getOwnedListOrThrow(listId, userId);
  const existing = await findItemById(listId, itemId);
  if (!existing) throw new ItemNotFoundError();

  const updated = await updateItem(listId, itemId, {
    productName: input.product_name?.trim(),
    quantity: input.quantity,
  });
  if (!updated) throw new ItemNotFoundError();
  return updated;
}

export async function removeItem(listId: string, userId: string, itemId: string): Promise<void> {
  await getOwnedListOrThrow(listId, userId);
  const deleted = await deleteItem(listId, itemId);
  if (!deleted) throw new ItemNotFoundError();
}

export async function compareList(listId: string, userId: string): Promise<ComparisonResult> {
  await getOwnedListOrThrow(listId, userId);

  const [items, supermarkets, allProducts] = await Promise.all([
    listItemsForList(listId),
    listSupermarkets(),
    listAllProducts(),
  ]);

  const productsBySupermarket = new Map<string, ComparisonProduct[]>();
  for (const product of allProducts) {
    const list = productsBySupermarket.get(product.supermarket_id) ?? [];
    list.push({
      id: product.id,
      supermarket_id: product.supermarket_id,
      product_name: product.product_name,
      price: Number(product.price),
      unit: product.unit,
    });
    productsBySupermarket.set(product.supermarket_id, list);
  }

  return compareShoppingList(
    items.map((item) => ({
      id: item.id,
      product_name: item.product_name,
      quantity: Number(item.quantity),
    })),
    supermarkets.map((s) => ({ id: s.id, name: s.name, unit_name: s.unit_name })),
    productsBySupermarket
  );
}
