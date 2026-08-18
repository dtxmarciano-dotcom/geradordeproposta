import { pool } from "../db/pool";
import { Supermarket } from "../models/supermarket";

export async function listSupermarkets(): Promise<Supermarket[]> {
  const result = await pool.query<Supermarket>(
    "SELECT * FROM supermarkets ORDER BY name ASC"
  );
  return result.rows;
}

export async function findSupermarketById(id: string): Promise<Supermarket | null> {
  const result = await pool.query<Supermarket>(
    "SELECT * FROM supermarkets WHERE id = $1",
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createSupermarket(input: {
  name: string;
  unitName: string;
  logoUrl: string | null;
  createdBy: string;
}): Promise<Supermarket> {
  const result = await pool.query<Supermarket>(
    `INSERT INTO supermarkets (name, unit_name, logo_url, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.name, input.unitName, input.logoUrl, input.createdBy]
  );
  return result.rows[0];
}

export async function updateSupermarket(
  id: string,
  input: { name?: string; unitName?: string; logoUrl?: string | null }
): Promise<Supermarket | null> {
  const result = await pool.query<Supermarket>(
    `UPDATE supermarkets
     SET name = COALESCE($2, name),
         unit_name = COALESCE($3, unit_name),
         logo_url = COALESCE($4, logo_url),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, input.name ?? null, input.unitName ?? null, input.logoUrl ?? null]
  );
  return result.rows[0] ?? null;
}

export async function deleteSupermarket(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM supermarkets WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function touchSupermarketUpdatedAt(id: string): Promise<void> {
  await pool.query("UPDATE supermarkets SET updated_at = now() WHERE id = $1", [id]);
}
