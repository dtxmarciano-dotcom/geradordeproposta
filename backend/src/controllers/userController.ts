import { Request, Response } from "express";
import { z } from "zod";
import {
  createUserAccount,
  editUserAccount,
  EmailAlreadyInUseError,
  getUsers,
  LastAdminError,
  removeUserAccount,
  UserNotFoundError,
} from "../services/userService";

const createSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
  role: z.enum(["admin", "user"]).optional().default("user"),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email("E-mail inválido").optional(),
  role: z.enum(["admin", "user"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").optional(),
});

export async function listUsersHandler(_req: Request, res: Response): Promise<void> {
  const users = await getUsers();
  res.status(200).json({ users });
}

export async function createUserHandler(req: Request, res: Response): Promise<void> {
  const parseResult = createSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input", details: parseResult.error.flatten() });
    return;
  }

  try {
    const user = await createUserAccount(parseResult.data);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      res.status(409).json({ error: "E-mail já está em uso" });
      return;
    }
    throw error;
  }
}

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  const parseResult = updateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input", details: parseResult.error.flatten() });
    return;
  }

  try {
    const user = await editUserAccount(req.params.id, parseResult.data);
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (error instanceof EmailAlreadyInUseError) {
      res.status(409).json({ error: "E-mail já está em uso" });
      return;
    }
    if (error instanceof LastAdminError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function deleteUserHandler(req: Request, res: Response): Promise<void> {
  try {
    await removeUserAccount(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (error instanceof LastAdminError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
}
