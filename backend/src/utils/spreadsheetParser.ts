import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { ProductInput } from "../models/product";

export type RawRow = Record<string, unknown>;

export interface RowError {
  row: number;
  reason: string;
}

export interface ParseRowsResult {
  valid: ProductInput[];
  errors: RowError[];
}

const PRODUCT_KEYS = ["produto"];
const PRICE_KEYS = ["preço", "preco"];
const UNIT_KEYS = ["unidade"];

export class MissingColumnsError extends Error {
  constructor(public missing: string[]) {
    super(`Missing required columns: ${missing.join(", ")}`);
    this.name = "MissingColumnsError";
  }
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function findKey(row: RawRow, candidates: string[]): string | undefined {
  const normalizedRowKeys = Object.keys(row);
  for (const key of normalizedRowKeys) {
    if (candidates.includes(normalizeHeader(key))) {
      return key;
    }
  }
  return undefined;
}

/**
 * Validates the header set of the first row against the required columns.
 * Accepts "preço" or "preco" (without accent) for the price column.
 */
export function validateColumns(rows: RawRow[]): string[] {
  if (rows.length === 0) {
    return ["produto", "preço", "unidade"];
  }

  const firstRow = rows[0];
  const missing: string[] = [];

  if (!findKey(firstRow, PRODUCT_KEYS)) missing.push("produto");
  if (!findKey(firstRow, PRICE_KEYS)) missing.push("preço");
  if (!findKey(firstRow, UNIT_KEYS)) missing.push("unidade");

  return missing;
}

function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }
  const str = String(raw)
    .trim()
    .replace(/[^0-9.,-]/g, "");
  if (str === "") return null;

  // Accepts both "24,90" (comma decimal, Brazilian) and "5.50" (dot decimal).
  // When both separators appear, the comma is treated as the decimal one
  // and dots as thousand separators (e.g. "1.234,56").
  let normalized: string;
  if (str.includes(",")) {
    normalized = str.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = str;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Pure function: takes raw parsed rows (already objects keyed by header)
 * and returns valid products plus per-row errors. Row numbers are 1-based
 * and account for the header row (row 1 = header, row 2 = first data row),
 * matching what an Admin sees when opening the spreadsheet.
 */
export function parseProductRows(rows: RawRow[]): ParseRowsResult {
  const missing = validateColumns(rows);
  if (missing.length > 0) {
    throw new MissingColumnsError(missing);
  }

  const valid: ProductInput[] = [];
  const errors: RowError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const productKey = findKey(row, PRODUCT_KEYS)!;
    const priceKey = findKey(row, PRICE_KEYS)!;
    const unitKey = findKey(row, UNIT_KEYS)!;

    const productName = String(row[productKey] ?? "").trim();
    const unit = String(row[unitKey] ?? "").trim();
    const price = parsePrice(row[priceKey]);

    if (!productName) {
      errors.push({ row: rowNumber, reason: "Nome do produto está vazio" });
      return;
    }
    if (!unit) {
      errors.push({ row: rowNumber, reason: "Unidade está vazia" });
      return;
    }
    if (price === null || price < 0) {
      errors.push({ row: rowNumber, reason: "Preço inválido" });
      return;
    }

    valid.push({ product_name: productName, price, unit });
  });

  return { valid, errors };
}

export function parseFileToRows(buffer: Buffer, originalName: string): RawRow[] {
  const extension = originalName.slice(originalName.lastIndexOf(".")).toLowerCase();

  if (extension === ".csv") {
    const text = buffer.toString("utf-8");
    return parseCsv(text, { columns: true, skip_empty_lines: true, trim: true }) as RawRow[];
  }

  if (extension === ".xlsx" || extension === ".xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
  }

  throw new Error(`Unsupported file extension: ${extension}`);
}
