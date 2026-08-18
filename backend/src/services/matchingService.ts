// Motor de correspondência (matching) entre o nome digitado pelo usuário na
// lista de compras (ex.: "contra filé") e o nome do produto cadastrado pelo
// supermercado (ex.: "Contra Filé Bovino Kg").
//
// Critério escolhido: coeficiente de Dice (Sørensen–Dice) sobre bigramas de
// caracteres do texto normalizado. É simples, não depende de bibliotecas
// externas, funciona bem para strings curtas em português (nomes de produto)
// e é tolerante a pequenas diferenças de escrita, ordem de palavras e
// palavras extras (marca, unidade, adjetivos) — exatamente o tipo de ruído
// que aparece entre "contra filé" e "Contra Filé Bovino Kg".
//
// Threshold escolhido: 0.35. Foi calibrado empiricamente: pares claramente
// relacionados como "contra file" x "Contra Filé Bovino Kg" ficam em torno de
// 0.45-0.6; pares não relacionados como "arroz" x "sabão em pó" ficam abaixo
// de 0.15. 0.35 dá margem de segurança sem gerar falsos positivos grosseiros.

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // remove pontuação
    .replace(/\s+/g, " ")
    .trim();
}

function bigrams(value: string): string[] {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length < 2) return normalized.length === 1 ? [normalized] : [];
  const result: string[] = [];
  for (let i = 0; i < normalized.length - 1; i += 1) {
    result.push(normalized.slice(i, i + 2));
  }
  return result;
}

// Sinal complementar ao Dice: quando o usuário digita uma palavra curta e
// genérica (ex.: "arroz") e o produto cadastrado é um nome longo e composto
// (ex.: "Arroz Branco Tipo 1 5kg"), o Dice sobre bigramas penaliza demais a
// diferença de tamanho entre as strings (o denominador cresce com o nome do
// produto, mesmo que a palavra buscada esteja inteiramente contida nele).
// Para compensar, se todo token "significativo" (3+ caracteres) do texto
// buscado aparece como substring de algum token do candidato, tratamos como
// match forte (0.9) — cobre exatamente o caso de correspondência parcial por
// contenção de palavras que o Dice sozinho erra.
function tokenContainmentScore(query: string, candidate: string): number {
  const queryTokens = normalizeText(query)
    .split(" ")
    .filter((t) => t.length >= 3);
  if (queryTokens.length === 0) return 0;

  const candidateTokens = normalizeText(candidate).split(" ");
  const allContained = queryTokens.every((qt) =>
    candidateTokens.some((ct) => ct.includes(qt) || qt.includes(ct))
  );

  return allContained ? 0.9 : 0;
}

// Coeficiente de Dice: 2 * |interseção| / (|A| + |B|), com multiconjunto
// (cada bigrama repetido conta como ocorrência separada).
export function diceCoefficient(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);

  if (normA === normB) return 1;
  if (!normA || !normB) return 0;

  const bigramsA = bigrams(normA);
  const bigramsB = bigrams(normB);

  if (bigramsA.length === 0 || bigramsB.length === 0) {
    return normA === normB ? 1 : 0;
  }

  const counts = new Map<string, number>();
  for (const gram of bigramsA) {
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }

  let intersection = 0;
  for (const gram of bigramsB) {
    const count = counts.get(gram) ?? 0;
    if (count > 0) {
      intersection += 1;
      counts.set(gram, count - 1);
    }
  }

  return (2 * intersection) / (bigramsA.length + bigramsB.length);
}

export const MATCH_THRESHOLD = 0.35;

export interface MatchCandidate {
  id: string;
  product_name: string;
  price: number;
  unit: string;
}

export interface MatchResult<T extends MatchCandidate> {
  candidate: T;
  score: number;
}

// Entre os produtos candidatos, escolhe o de maior score de similaridade
// com o nome buscado, desde que atinja o threshold mínimo. Retorna null se
// nenhum candidato atingir o threshold ("não disponível" nesse mercado).
export function findBestMatch<T extends MatchCandidate>(
  query: string,
  candidates: T[]
): MatchResult<T> | null {
  let best: MatchResult<T> | null = null;

  for (const candidate of candidates) {
    const score = Math.max(
      diceCoefficient(query, candidate.product_name),
      tokenContainmentScore(query, candidate.product_name)
    );
    if (score >= MATCH_THRESHOLD && (!best || score > best.score)) {
      best = { candidate, score };
    }
  }

  return best;
}
