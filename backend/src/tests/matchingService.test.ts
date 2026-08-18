import { describe, it, expect } from "vitest";
import { diceCoefficient, findBestMatch, normalizeText } from "../services/matchingService";

describe("normalizeText", () => {
  it("lowercases, removes accents and trims", () => {
    expect(normalizeText("  Contra Filé Bovino Kg  ")).toBe("contra file bovino kg");
  });
});

describe("diceCoefficient", () => {
  it("scores an exact match as 1", () => {
    expect(diceCoefficient("Arroz", "arroz")).toBe(1);
  });

  it("scores an approximate match with small spelling differences highly", () => {
    const score = diceCoefficient("contra file", "Contra Filé Bovino Kg");
    expect(score).toBeGreaterThan(0.35);
  });

  it("scores a completely different product low", () => {
    const score = diceCoefficient("arroz", "sabão em pó");
    expect(score).toBeLessThan(0.15);
  });
});

describe("findBestMatch", () => {
  const candidates = [
    { id: "1", product_name: "Contra Filé Bovino Kg", price: 45.9, unit: "kg" },
    { id: "2", product_name: "Filé de Frango Kg", price: 22.5, unit: "kg" },
    { id: "3", product_name: "Sabão em Pó 1kg", price: 12.0, unit: "un" },
  ];

  it("picks the candidate with the highest score above the threshold", () => {
    const match = findBestMatch("contra file", candidates);
    expect(match?.candidate.id).toBe("1");
  });

  it("returns null when no candidate reaches the threshold", () => {
    const match = findBestMatch("iogurte natural", candidates);
    expect(match).toBeNull();
  });

  it("matches a short generic word against a longer product name via token containment", () => {
    const withArroz = [
      ...candidates,
      { id: "4", product_name: "Arroz Branco Tipo 1 5kg", price: 24.5, unit: "un" },
    ];
    const match = findBestMatch("arroz", withArroz);
    expect(match?.candidate.id).toBe("4");
  });
});
