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
