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
