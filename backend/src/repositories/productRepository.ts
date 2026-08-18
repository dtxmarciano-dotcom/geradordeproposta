import { PoolClient } from "pg";
import { pool } from "../db/pool";
import { Product, ProductInput } from "../models/product";

export async function listAllProducts(): Promise<Product[]> {
  const result = await pool.query<Product>("SELECT * FROM products ORDER BY supermarket_id ASC");
  return result.rows;
}

export async function replaceProductsForSupermarket(
  supermarketId: string,
  products: ProductInput[]
): Promise<void> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM products WHERE supermarket_id = $1", [supermarketId]);

    for (const product of products) {
      await client.query(
        `INSERT INTO products (supermarket_id, product_name, price, unit)
         VALUES ($1, $2, $3, $4)`,
        [supermarketId, product.product_name, product.price, product.unit]
      );
    }

    await client.query(
      "UPDATE supermarkets SET updated_at = now() WHERE id = $1",
      [supermarketId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
