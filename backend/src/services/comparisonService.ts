import { findBestMatch, MatchCandidate } from "./matchingService";

export interface ComparisonListItem {
  id: string;
  product_name: string;
  quantity: number;
}

export interface ComparisonSupermarket {
  id: string;
  name: string;
  unit_name: string;
  logo_url: string | null;
}

export interface ComparisonProduct extends MatchCandidate {
  supermarket_id: string;
}

export interface ItemOfferResult {
  supermarket_id: string;
  supermarket_name: string;
  available: boolean;
  matched_product_name: string | null;
  unit_price: number | null;
  quantity: number;
  subtotal: number | null;
  is_cheapest: boolean;
}

export interface ItemComparisonResult {
  item_id: string;
  product_name: string;
  quantity: number;
  offers: ItemOfferResult[];
  cheapest_supermarket_id: string | null;
  cheapest_price: number | null;
}

export interface SupermarketBasketResult {
  supermarket_id: string;
  supermarket_name: string;
  unit_name: string;
  logo_url: string | null;
  total: number;
  items_found: number;
  items_total: number;
  is_winner: boolean;
  savings_vs_most_expensive: number;
  rank: number;
}

export interface ComparisonResult {
  items: ItemComparisonResult[];
  supermarkets: SupermarketBasketResult[];
  winner: SupermarketBasketResult | null;
  max_savings: number;
  has_any_result: boolean;
}

// Núcleo puro do comparador: recebe os itens da lista, os supermercados e os
// produtos de cada supermercado (já carregados do banco pelo repositório) e
// devolve a comparação completa. Nunca é persistido — calculado a cada
// consulta em GET /lists/:id/compare.
export function compareShoppingList(
  items: ComparisonListItem[],
  supermarkets: ComparisonSupermarket[],
  productsBySupermarket: Map<string, ComparisonProduct[]>
): ComparisonResult {
  const itemResults: ItemComparisonResult[] = items.map((item) => {
    const offers: ItemOfferResult[] = supermarkets.map((supermarket) => {
      const candidates = productsBySupermarket.get(supermarket.id) ?? [];
      const match = findBestMatch(item.product_name, candidates);

      if (!match) {
        return {
          supermarket_id: supermarket.id,
          supermarket_name: supermarket.name,
          available: false,
          matched_product_name: null,
          unit_price: null,
          quantity: item.quantity,
          subtotal: null,
          is_cheapest: false,
        };
      }

      const subtotal = round2(match.candidate.price * item.quantity);
      return {
        supermarket_id: supermarket.id,
        supermarket_name: supermarket.name,
        available: true,
        matched_product_name: match.candidate.product_name,
        unit_price: match.candidate.price,
        quantity: item.quantity,
        subtotal,
        is_cheapest: false,
      };
    });

    const available = offers.filter((offer) => offer.available && offer.unit_price !== null);
    let cheapestSupermarketId: string | null = null;
    let cheapestPrice: number | null = null;

    if (available.length > 0) {
      const cheapest = available.reduce((min, offer) =>
        (offer.unit_price as number) < (min.unit_price as number) ? offer : min
      );
      cheapestSupermarketId = cheapest.supermarket_id;
      cheapestPrice = cheapest.unit_price;
      cheapest.is_cheapest = true;
    }

    return {
      item_id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
      offers,
      cheapest_supermarket_id: cheapestSupermarketId,
      cheapest_price: cheapestPrice,
    };
  });

  const baskets = supermarkets.map((supermarket) => {
    let total = 0;
    let itemsFound = 0;

    for (const itemResult of itemResults) {
      const offer = itemResult.offers.find((o) => o.supermarket_id === supermarket.id);
      if (offer && offer.available && offer.subtotal !== null) {
        total += offer.subtotal;
        itemsFound += 1;
      }
    }

    return {
      supermarket_id: supermarket.id,
      supermarket_name: supermarket.name,
      unit_name: supermarket.unit_name,
      logo_url: supermarket.logo_url,
      total: round2(total),
      items_found: itemsFound,
      items_total: items.length,
    };
  });

  const withResults = baskets.filter((basket) => basket.items_found > 0);
  const sorted = [...withResults].sort((a, b) => a.total - b.total);
  const mostExpensiveTotal = sorted.length > 0 ? sorted[sorted.length - 1].total : 0;

  const supermarketResults: SupermarketBasketResult[] = baskets
    .map((basket) => {
      const rankIndex = sorted.findIndex((b) => b.supermarket_id === basket.supermarket_id);
      const isRanked = rankIndex !== -1;
      return {
        ...basket,
        is_winner: isRanked && rankIndex === 0,
        savings_vs_most_expensive: isRanked ? round2(mostExpensiveTotal - basket.total) : 0,
        rank: isRanked ? rankIndex + 1 : sorted.length + 1,
      };
    })
    .sort((a, b) => a.rank - b.rank);

  const winner = supermarketResults.find((s) => s.is_winner) ?? null;
  const maxSavings =
    sorted.length >= 2 ? round2(sorted[sorted.length - 1].total - sorted[0].total) : 0;

  return {
    items: itemResults,
    supermarkets: supermarketResults,
    winner,
    max_savings: maxSavings,
    has_any_result: withResults.length > 0,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
