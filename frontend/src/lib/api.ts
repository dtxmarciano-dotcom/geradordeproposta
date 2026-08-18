const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

function humanizeLoginError(status: number): string {
  if (status === 401) return "E-mail ou senha incorretos.";
  if (status === 403) return "Sua conta está desativada.";
  if (status === 429) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return "Não foi possível entrar. Tente novamente.";
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new ApiError("Não foi possível conectar. Tente novamente.", 0);
  }

  if (!response.ok) {
    throw new ApiError(humanizeLoginError(response.status), response.status);
  }

  return response.json() as Promise<LoginResponse>;
}

export interface Supermarket {
  id: string;
  name: string;
  unit_name: string;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  created_at: string;
}

export interface UploadResult {
  total: number;
  imported: number;
  errors: { row: number; reason: string }[];
}

function humanizeGenericError(status: number): string {
  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 403) return "Você não tem permissão para essa ação.";
  if (status === 404) return "Registro não encontrado.";
  if (status === 409) return "E-mail já está em uso.";
  return "Não foi possível concluir a operação. Tente novamente.";
}

async function authFetch(
  token: string,
  path: string,
  options: { method?: string; body?: unknown; isFormData?: boolean } = {}
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.isFormData ? {} : { "Content-Type": "application/json" }),
      },
      body: options.isFormData
        ? (options.body as FormData)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
    });
  } catch {
    throw new ApiError("Não foi possível conectar. Tente novamente.", 0);
  }
  return response;
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = humanizeGenericError(response.status);
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // resposta sem corpo JSON, mantém mensagem genérica
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function listSupermarkets(token: string): Promise<Supermarket[]> {
  const response = await authFetch(token, "/admin/supermarkets");
  const data = await parseJsonOrThrow<{ supermarkets: Supermarket[] }>(response);
  return data.supermarkets;
}

export async function createSupermarket(
  token: string,
  input: { name: string; unit_name: string; logo_url?: string | null }
): Promise<Supermarket> {
  const response = await authFetch(token, "/admin/supermarkets", { method: "POST", body: input });
  const data = await parseJsonOrThrow<{ supermarket: Supermarket }>(response);
  return data.supermarket;
}

export async function updateSupermarket(
  token: string,
  id: string,
  input: { name?: string; unit_name?: string; logo_url?: string | null }
): Promise<Supermarket> {
  const response = await authFetch(token, `/admin/supermarkets/${id}`, {
    method: "PUT",
    body: input,
  });
  const data = await parseJsonOrThrow<{ supermarket: Supermarket }>(response);
  return data.supermarket;
}

export async function deleteSupermarket(token: string, id: string): Promise<void> {
  const response = await authFetch(token, `/admin/supermarkets/${id}`, { method: "DELETE" });
  await parseJsonOrThrow<void>(response);
}

export async function uploadSupermarketProducts(
  token: string,
  id: string,
  file: File
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await authFetch(token, `/admin/supermarkets/${id}/products/upload`, {
    method: "POST",
    body: formData,
    isFormData: true,
  });
  return parseJsonOrThrow<UploadResult>(response);
}

export async function listUsers(token: string): Promise<AdminUser[]> {
  const response = await authFetch(token, "/admin/users");
  const data = await parseJsonOrThrow<{ users: AdminUser[] }>(response);
  return data.users;
}

export async function createUser(
  token: string,
  input: { name: string; email: string; password: string; role: "admin" | "user" }
): Promise<AdminUser> {
  const response = await authFetch(token, "/admin/users", { method: "POST", body: input });
  const data = await parseJsonOrThrow<{ user: AdminUser }>(response);
  return data.user;
}

export async function updateUser(
  token: string,
  id: string,
  input: {
    name?: string;
    email?: string;
    role?: "admin" | "user";
    status?: "active" | "inactive";
    password?: string;
  }
): Promise<AdminUser> {
  const response = await authFetch(token, `/admin/users/${id}`, { method: "PUT", body: input });
  const data = await parseJsonOrThrow<{ user: AdminUser }>(response);
  return data.user;
}

export async function deleteUser(token: string, id: string): Promise<void> {
  const response = await authFetch(token, `/admin/users/${id}`, { method: "DELETE" });
  await parseJsonOrThrow<void>(response);
}

export interface ShoppingList {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
}

export interface ShoppingListSummary extends ShoppingList {
  item_count: number;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  product_name: string;
  quantity: string;
}

export async function listShoppingLists(token: string): Promise<ShoppingListSummary[]> {
  const response = await authFetch(token, "/lists");
  const data = await parseJsonOrThrow<{ lists: ShoppingListSummary[] }>(response);
  return data.lists;
}

export async function createShoppingList(
  token: string,
  title?: string
): Promise<ShoppingList> {
  const response = await authFetch(token, "/lists", { method: "POST", body: { title } });
  const data = await parseJsonOrThrow<{ list: ShoppingList }>(response);
  return data.list;
}

export async function getShoppingList(
  token: string,
  id: string
): Promise<{ list: ShoppingList; items: ShoppingListItem[] }> {
  const response = await authFetch(token, `/lists/${id}`);
  return parseJsonOrThrow(response);
}

export async function updateShoppingList(
  token: string,
  id: string,
  title: string
): Promise<ShoppingList> {
  const response = await authFetch(token, `/lists/${id}`, { method: "PUT", body: { title } });
  const data = await parseJsonOrThrow<{ list: ShoppingList }>(response);
  return data.list;
}

export async function deleteShoppingList(token: string, id: string): Promise<void> {
  const response = await authFetch(token, `/lists/${id}`, { method: "DELETE" });
  await parseJsonOrThrow<void>(response);
}

export async function addShoppingListItem(
  token: string,
  listId: string,
  input: { product_name: string; quantity?: number }
): Promise<ShoppingListItem[]> {
  const response = await authFetch(token, `/lists/${listId}/items`, {
    method: "POST",
    body: input,
  });
  const data = await parseJsonOrThrow<{ items: ShoppingListItem[] }>(response);
  return data.items;
}

export async function updateShoppingListItem(
  token: string,
  listId: string,
  itemId: string,
  input: { product_name?: string; quantity?: number }
): Promise<ShoppingListItem> {
  const response = await authFetch(token, `/lists/${listId}/items/${itemId}`, {
    method: "PUT",
    body: input,
  });
  const data = await parseJsonOrThrow<{ item: ShoppingListItem }>(response);
  return data.item;
}

export async function deleteShoppingListItem(
  token: string,
  listId: string,
  itemId: string
): Promise<void> {
  const response = await authFetch(token, `/lists/${listId}/items/${itemId}`, {
    method: "DELETE",
  });
  await parseJsonOrThrow<void>(response);
}

export interface ItemOffer {
  supermarket_id: string;
  supermarket_name: string;
  available: boolean;
  matched_product_name: string | null;
  unit_price: number | null;
  quantity: number;
  subtotal: number | null;
  is_cheapest: boolean;
}

export interface ItemComparison {
  item_id: string;
  product_name: string;
  quantity: number;
  offers: ItemOffer[];
  cheapest_supermarket_id: string | null;
  cheapest_price: number | null;
}

export interface SupermarketBasket {
  supermarket_id: string;
  supermarket_name: string;
  unit_name: string;
  total: number;
  items_found: number;
  items_total: number;
  is_winner: boolean;
  savings_vs_most_expensive: number;
  rank: number;
}

export interface ComparisonResult {
  items: ItemComparison[];
  supermarkets: SupermarketBasket[];
  winner: SupermarketBasket | null;
  max_savings: number;
  has_any_result: boolean;
}

export async function compareShoppingList(token: string, listId: string): Promise<ComparisonResult> {
  const response = await authFetch(token, `/lists/${listId}/compare`);
  return parseJsonOrThrow(response);
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename="?([^";]+)"?/.exec(header);
  return match ? match[1] : null;
}

export async function downloadShoppingListPdf(token: string, listId: string): Promise<void> {
  const response = await authFetch(token, `/lists/${listId}/pdf`);
  if (!response.ok) {
    let message = humanizeGenericError(response.status);
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // resposta sem corpo JSON, mantém mensagem genérica
    }
    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  const filename = filenameFromContentDisposition(response.headers.get("Content-Disposition")) ?? `vantta-lista-${listId}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
