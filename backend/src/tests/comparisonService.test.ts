import { describe, it, expect } from "vitest";
import {
  compareShoppingList,
  ComparisonProduct,
  ComparisonSupermarket,
} from "../services/comparisonService";

const supermarkets: ComparisonSupermarket[] = [
  { id: "s1", name: "Mercado A", unit_name: "Centro", logo_url: null },
  { id: "s2", name: "Mercado B", unit_name: "Norte", logo_url: null },
];

const productsBySupermarket = new Map<string, ComparisonProduct[]>([
  [
    "s1",
    [
      { id: "p1", supermarket_id: "s1", product_name: "Contra Filé Bovino Kg", price: 50, unit: "kg" },
      { id: "p2", supermarket_id: "s1", product_name: "Arroz Branco 5kg", price: 25, unit: "un" },
    ],
  ],
  [
    "s2",
    [
      { id: "p3", supermarket_id: "s2", product_name: "Contra Filé Kg", price: 40, unit: "kg" },
      // sem arroz em s2
    ],
  ],
]);

describe("compareShoppingList", () => {
  it("finds approximate matches and computes the basket total per supermarket", () => {
    const result = compareShoppingList(
      [
        { id: "i1", product_name: "contra file", quantity: 2 },
        { id: "i2", product_name: "arroz", quantity: 1 },
      ],
      supermarkets,
      productsBySupermarket
    );

    const basketS1 = result.supermarkets.find((s) => s.supermarket_id === "s1")!;
    const basketS2 = result.supermarkets.find((s) => s.supermarket_id === "s2")!;

    expect(basketS1.total).toBe(125); // 50*2 + 25
    expect(basketS1.items_found).toBe(2);
    expect(basketS2.total).toBe(80); // 40*2, arroz não disponível
    expect(basketS2.items_found).toBe(1);
  });

  it("picks the cheapest supermarket as winner and computes savings", () => {
    const result = compareShoppingList(
      [{ id: "i1", product_name: "contra file", quantity: 1 }],
      supermarkets,
      productsBySupermarket
    );

    expect(result.winner?.supermarket_id).toBe("s2"); // 40 < 50
    expect(result.max_savings).toBe(10);
  });

  it("marks the cheapest offer per item", () => {
    const result = compareShoppingList(
      [{ id: "i1", product_name: "contra file", quantity: 1 }],
      supermarkets,
      productsBySupermarket
    );

    const item = result.items[0];
    expect(item.cheapest_supermarket_id).toBe("s2");
    const cheapestOffer = item.offers.find((o) => o.supermarket_id === "s2");
    expect(cheapestOffer?.is_cheapest).toBe(true);
  });

  it("reports has_any_result as false when nothing matches anywhere", () => {
    const result = compareShoppingList(
      [{ id: "i1", product_name: "iogurte grego", quantity: 1 }],
      supermarkets,
      productsBySupermarket
    );

    expect(result.has_any_result).toBe(false);
    expect(result.winner).toBeNull();
  });
});
