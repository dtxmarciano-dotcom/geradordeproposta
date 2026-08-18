import bcrypt from "bcrypt";
import { findUserByEmail } from "../repositories/userRepository";
import { signToken } from "../utils/jwt";
import { toPublicUser, PublicUser } from "../models/user";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

export class InactiveUserError extends Error {
  constructor() {
    super("User is inactive");
    this.name = "InactiveUserError";
  }
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }

  if (user.status === "inactive") {
    throw new InactiveUserError();
  }

  const token = signToken({ id: user.id, role: user.role });

  return { token, user: toPublicUser(user) };
}
