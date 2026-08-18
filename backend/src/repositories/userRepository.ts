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

export async function listUsers(): Promise<User[]> {
  const result = await pool.query<User>("SELECT * FROM users ORDER BY name ASC");
  return result.rows;
}

export async function countActiveAdmins(excludingId?: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM users
     WHERE role = 'admin' AND status = 'active' ${excludingId ? "AND id <> $1" : ""}`,
    excludingId ? [excludingId] : []
  );
  return Number(result.rows[0].count);
}

export async function updateUser(
  id: string,
  input: {
    name?: string;
    email?: string;
    role?: "admin" | "user";
    status?: "active" | "inactive";
    passwordHash?: string;
  }
): Promise<User | null> {
  const result = await pool.query<User>(
    `UPDATE users
     SET name = COALESCE($2, name),
         email = COALESCE($3, email),
         role = COALESCE($4, role),
         status = COALESCE($5, status),
         password_hash = COALESCE($6, password_hash)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.name ?? null,
      input.email ?? null,
      input.role ?? null,
      input.status ?? null,
      input.passwordHash ?? null,
    ]
  );
  return result.rows[0] ?? null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
