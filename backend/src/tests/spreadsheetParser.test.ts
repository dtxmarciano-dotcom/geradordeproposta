import { describe, it, expect } from "vitest";
import {
  MissingColumnsError,
  parseProductRows,
  validateColumns,
} from "../utils/spreadsheetParser";

describe("validateColumns", () => {
  it("returns no missing columns when all required headers are present", () => {
    expect(validateColumns([{ produto: "Arroz", preço: "10", unidade: "kg" }])).toEqual([]);
  });

  it("accepts 'preco' without accent as the price column", () => {
    expect(validateColumns([{ produto: "Arroz", preco: "10", unidade: "kg" }])).toEqual([]);
  });

  it("reports missing columns", () => {
    expect(validateColumns([{ produto: "Arroz" }])).toEqual(
      expect.arrayContaining(["preço", "unidade"])
    );
  });

  it("treats an empty file as missing all required columns", () => {
    expect(validateColumns([])).toEqual(["produto", "preço", "unidade"]);
  });
});

describe("parseProductRows", () => {
  it("throws MissingColumnsError when required columns are absent", () => {
    expect(() => parseProductRows([{ nome: "Arroz", valor: "10" }])).toThrow(
      MissingColumnsError
    );
  });

  it("imports valid rows and reports invalid ones without throwing", () => {
    const rows = [
      { produto: "Arroz 5kg", preço: "24,90", unidade: "un" },
      { produto: "", preço: "10", unidade: "un" },
      { produto: "Feijão", preço: "abc", unidade: "kg" },
      { produto: "Leite", preço: "5.50", unidade: "un" },
    ];

    const result = parseProductRows(rows);

    expect(result.valid).toEqual([
      { product_name: "Arroz 5kg", price: 24.9, unit: "un" },
      { product_name: "Leite", price: 5.5, unit: "un" },
    ]);
    expect(result.errors).toEqual([
      { row: 3, reason: "Nome do produto está vazio" },
      { row: 4, reason: "Preço inválido" },
    ]);
  });

  it("trims whitespace from product name and unit", () => {
    const result = parseProductRows([
      { produto: "  Arroz  ", preço: "10", unidade: "  un  " },
    ]);
    expect(result.valid).toEqual([{ product_name: "Arroz", price: 10, unit: "un" }]);
  });

  it("rejects negative prices", () => {
    const result = parseProductRows([{ produto: "Arroz", preço: "-5", unidade: "un" }]);
    expect(result.valid).toEqual([]);
    expect(result.errors).toEqual([{ row: 2, reason: "Preço inválido" }]);
  });
});
