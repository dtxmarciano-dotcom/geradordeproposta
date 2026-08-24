import {
  createSupermarket,
  deleteSupermarket,
  findSupermarketById,
  listSupermarkets,
  updateSupermarket,
} from "../repositories/supermarketRepository";
import { replaceProductsForSupermarket } from "../repositories/productRepository";
import {
  MissingColumnsError,
  ParseRowsResult,
  parseFileToRows,
  parseProductRows,
} from "../utils/spreadsheetParser";
import { Supermarket } from "../models/supermarket";

export class SupermarketNotFoundError extends Error {
  constructor() {
    super("Supermarket not found");
    this.name = "SupermarketNotFoundError";
  }
}

export async function getSupermarkets(): Promise<Supermarket[]> {
  return listSupermarkets();
}

export async function getSupermarketOrThrow(id: string): Promise<Supermarket> {
  const supermarket = await findSupermarketById(id);
  if (!supermarket) {
    throw new SupermarketNotFoundError();
  }
  return supermarket;
}

export async function registerSupermarket(input: {
  name: string;
  unitName: string;
  logoUrl: string | null;
  createdBy: string;
}): Promise<Supermarket> {
  return createSupermarket(input);
}

export async function attachSupermarketLogo(
  id: string,
  logoUrl: string
): Promise<Supermarket> {
  await getSupermarketOrThrow(id);
  const updated = await updateSupermarket(id, { logoUrl });
  if (!updated) {
    throw new SupermarketNotFoundError();
  }
  return updated;
}

export async function editSupermarket(
  id: string,
  input: { name?: string; unitName?: string; logoUrl?: string | null }
): Promise<Supermarket> {
  await getSupermarketOrThrow(id);
  const updated = await updateSupermarket(id, input);
  if (!updated) {
    throw new SupermarketNotFoundError();
  }
  return updated;
}

export async function removeSupermarket(id: string): Promise<void> {
  const deleted = await deleteSupermarket(id);
  if (!deleted) {
    throw new SupermarketNotFoundError();
  }
}

export interface UploadResult extends ParseRowsResult {
  total: number;
  imported: number;
}

export async function importProductsFromFile(
  supermarketId: string,
  file: { buffer: Buffer; originalname: string }
): Promise<UploadResult> {
  await getSupermarketOrThrow(supermarketId);

  const rows = parseFileToRows(file.buffer, file.originalname);
  let parsed;
  try {
    parsed = parseProductRows(rows);
  } catch (error) {
    if (error instanceof MissingColumnsError) {
      throw error;
    }
    throw error;
  }

  await replaceProductsForSupermarket(supermarketId, parsed.valid);

  return {
    valid: parsed.valid,
    errors: parsed.errors,
    total: rows.length,
    imported: parsed.valid.length,
  };
}
