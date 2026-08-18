import { Request, Response } from "express";
import { z } from "zod";
import { login, InvalidCredentialsError, InactiveUserError } from "../services/authService";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input", details: parseResult.error.flatten() });
    return;
  }

  const { email, password } = parseResult.data;

  try {
    const result = await login(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (error instanceof InactiveUserError) {
      res.status(403).json({ error: "User is inactive" });
      return;
    }
    throw error;
  }
}

export function logoutHandler(_req: Request, res: Response): void {
  res.status(200).json({ message: "Logged out. Discard the token client-side." });
}
