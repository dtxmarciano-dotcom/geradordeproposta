"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  ApiError,
  ComparisonResult,
  ItemComparison,
  compareShoppingList,
  downloadShoppingListPdf,
  getShoppingList,
} from "@/lib/api";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ComparePage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading: authLoading } = useRequireAuth("user");
  const { user, token } = useAuth();

  const [listTitle, setListTitle] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [listData, comparison] = await Promise.all([
        getShoppingList(token, id),
        compareShoppingList(token, id),
      ]);
      setListTitle(listData.list.title);
      setResult(comparison);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível comparar os preços agora."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, id]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleDownloadPdf() {
    if (!token || !id) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadShoppingListPdf(token, id);
    } catch (err) {
      setDownloadError(
        err instanceof ApiError ? err.message : "Não foi possível gerar o PDF agora."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">{listTitle || "Sua lista"}</p>
            <h1 className="text-2xl font-bold text-foreground">Comparação de preços</h1>
          </div>
          {!isLoading && !error && result?.has_any_result ? (
            <Button
              variant="secondary"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              aria-busy={isDownloading}
            >
              {isDownloading ? "Gerando PDF..." : "Exportar PDF"}
            </Button>
          ) : null}
        </div>

        {downloadError ? (
          <Alert variant="error" title="Não foi possível baixar o PDF">
            {downloadError}
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
            <Spinner size="lg" />
            <p className="text-sm text-neutral-500">Comparando preços entre os supermercados...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col gap-4">
            <Alert variant="error" title="Não foi possível comparar os preços">
              {error}
            </Alert>
            <Button onClick={load} className="self-start">
              Tentar novamente
            </Button>
          </div>
        ) : !result ? null : !result.has_any_result ? (
          <EmptyState
            title="Não encontramos preços para os itens dessa lista"
            description="Nenhum dos supermercados cadastrados tem produtos parecidos com os itens da sua lista. Tente revisar os nomes dos produtos ou aguarde novos supermercados serem cadastrados."
          />
        ) : (
          <ComparisonView result={result} />
        )}
      </main>
    </div>
  );
}

function ComparisonView({ result }: { result: ComparisonResult }) {
  const winner = result.winner;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-center gap-2 rounded-2xl border border-vantta-200 bg-vantta-50 px-6 py-10 text-center">
        {result.max_savings > 0 ? (
          <>
            <p className="text-sm font-medium text-vantta-700">Boa notícia</p>
            <h2 className="text-3xl font-bold text-vantta-800 sm:text-4xl">
              Você pode economizar até {formatCurrency(result.max_savings)}
            </h2>
          </>
        ) : (
          <h2 className="text-2xl font-bold text-vantta-800">
            Os preços estão parecidos entre os supermercados
          </h2>
        )}
        {winner ? (
          <p className="mt-2 text-base text-vantta-700">
            Melhor opção para sua compra:{" "}
            <span className="font-semibold">{winner.supermarket_name}</span>, por{" "}
            <span className="font-semibold">{formatCurrency(winner.total)}</span>
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-foreground">Comparação por supermercado</h3>
        <div className="flex flex-col gap-3">
          {result.supermarkets.map((basket) => (
            <Card
              key={basket.supermarket_id}
              className={
                basket.is_winner
                  ? "border-vantta-400 bg-vantta-50 shadow-md shadow-vantta-900/10"
                  : ""
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      basket.is_winner
                        ? "bg-vantta-500 text-white"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {basket.rank}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{basket.supermarket_name}</p>
                    <p className="text-xs text-neutral-500">{basket.unit_name}</p>
                  </div>
                  {basket.is_winner ? <Badge variant="success">Melhor preço</Badge> : null}
                </div>
                <div className="text-right">
                  <p
                    className={`text-xl font-bold ${
                      basket.is_winner ? "text-vantta-700" : "text-foreground"
                    }`}
                  >
                    {formatCurrency(basket.total)}
                  </p>
                  {!basket.is_winner && basket.savings_vs_most_expensive > 0 ? (
                    <p className="text-xs text-neutral-500">
                      economiza {formatCurrency(basket.savings_vs_most_expensive)} vs. o mais caro
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>
                  {basket.items_found} de {basket.items_total} itens encontrados
                </span>
                {basket.items_found < basket.items_total ? (
                  <span className="text-neutral-400">
                    {basket.items_total - basket.items_found} item(ns) sem preço disponível
                  </span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Onde cada produto está mais barato?
          </h3>
          <p className="text-sm text-neutral-500">
            O menor preço de cada item, com a opção de ver os demais supermercados.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {result.items.map((item) => (
            <ItemComparisonCard key={item.item_id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ItemComparisonCard({ item }: { item: ItemComparison }) {
  const [expanded, setExpanded] = useState(false);
  const cheapestOffer = item.offers.find((o) => o.is_cheapest);
  const otherOffers = item.offers.filter((o) => !o.is_cheapest);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{item.product_name}</p>
          <p className="text-xs text-neutral-500">Quantidade: {item.quantity}</p>
        </div>
        {cheapestOffer ? (
          <div className="text-right">
            <Badge variant="success">Menor preço</Badge>
            <p className="mt-1 text-lg font-bold text-vantta-700">
              {formatCurrency(cheapestOffer.unit_price as number)}
            </p>
            <p className="text-xs text-neutral-500">{cheapestOffer.supermarket_name}</p>
          </div>
        ) : (
          <Badge variant="neutral">Preço não disponível</Badge>
        )}
      </div>

      {otherOffers.length > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-xs font-medium text-vantta-700 hover:underline"
        >
          {expanded ? "Ocultar outros preços" : "Ver outros preços"}
        </button>
      ) : null}

      {expanded ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {otherOffers.map((offer) => (
            <div
              key={offer.supermarket_id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-neutral-600">{offer.supermarket_name}</span>
              {offer.available ? (
                <span className="font-medium text-foreground">
                  {formatCurrency(offer.unit_price as number)}
                </span>
              ) : (
                <span className="text-neutral-400">Preço não disponível</span>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
