import { pool } from "../db/pool";
import { User } from "../models/user";

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query<User>("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await pool.query<User>("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0] ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
}): Promise<User> {
  const result = await pool.query<User>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.name, input.email, input.passwordHash, input.role]
  );
  return result.rows[0];
}
