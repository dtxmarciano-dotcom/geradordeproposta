import bcrypt from "bcrypt";
import {
  countActiveAdmins,
  createUser,
  deleteUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUser,
} from "../repositories/userRepository";
import { AdminUserView, toAdminUserView, UserRole, UserStatus } from "../models/user";

const SALT_ROUNDS = 10;

export class UserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "UserNotFoundError";
  }
}

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("Email already in use");
    this.name = "EmailAlreadyInUseError";
  }
}

export class LastAdminError extends Error {
  constructor(message = "Não é possível remover o único administrador ativo") {
    super(message);
    this.name = "LastAdminError";
  }
}

export async function getUsers(): Promise<AdminUserView[]> {
  const users = await listUsers();
  return users.map(toAdminUserView);
}

export async function createUserAccount(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<AdminUserView> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new EmailAlreadyInUseError();
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
  });
  return toAdminUserView(user);
}

export async function editUserAccount(
  id: string,
  input: {
    name?: string;
    email?: string;
    role?: UserRole;
    status?: UserStatus;
    password?: string;
  }
): Promise<AdminUserView> {
  const existing = await findUserById(id);
  if (!existing) {
    throw new UserNotFoundError();
  }

  if (input.email && input.email !== existing.email) {
    const emailOwner = await findUserByEmail(input.email);
    if (emailOwner && emailOwner.id !== id) {
      throw new EmailAlreadyInUseError();
    }
  }

  const losesAdminStatus =
    existing.role === "admin" &&
    existing.status === "active" &&
    ((input.role !== undefined && input.role !== "admin") ||
      (input.status !== undefined && input.status !== "active"));

  if (losesAdminStatus) {
    const remainingActiveAdmins = await countActiveAdmins(id);
    if (remainingActiveAdmins === 0) {
      throw new LastAdminError();
    }
  }

  const passwordHash = input.password ? await bcrypt.hash(input.password, SALT_ROUNDS) : undefined;

  const updated = await updateUser(id, {
    name: input.name,
    email: input.email,
    role: input.role,
    status: input.status,
    passwordHash,
  });
  if (!updated) {
    throw new UserNotFoundError();
  }
  return toAdminUserView(updated);
}

export async function removeUserAccount(id: string): Promise<void> {
  const existing = await findUserById(id);
  if (!existing) {
    throw new UserNotFoundError();
  }

  if (existing.role === "admin" && existing.status === "active") {
    const remainingActiveAdmins = await countActiveAdmins(id);
    if (remainingActiveAdmins === 0) {
      throw new LastAdminError("Não é possível excluir o único administrador ativo");
    }
  }

  const deleted = await deleteUser(id);
  if (!deleted) {
    throw new UserNotFoundError();
  }
}
