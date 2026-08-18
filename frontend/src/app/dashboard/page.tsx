"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { ApiError, ShoppingListSummary, listShoppingLists } from "@/lib/api";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { isLoading: authLoading } = useRequireAuth("user");
  const { user, token } = useAuth();

  const [lists, setLists] = useState<ShoppingListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      setLists(await listShoppingLists(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar suas listas.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Olá, {user.name.split(" ")[0]}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Monte sua lista de compras e descubra onde ela sai mais barata.
            </p>
          </div>
          <LinkButton href="/lists/new" size="lg">
            + Nova lista
          </LinkButton>
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : lists.length === 0 ? (
          <EmptyState
            title="Você ainda não criou nenhuma lista"
            description="Crie sua primeira lista e descubra onde economizar."
            action={<LinkButton href="/lists/new">Criar minha primeira lista</LinkButton>}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-neutral-500">Suas listas</h2>
            {lists.map((list) => (
              <Link key={list.id} href={`/lists/${list.id}`}>
                <Card className="flex items-center justify-between gap-4 transition-colors hover:border-vantta-300">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {list.title || "Lista sem nome"}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {list.item_count} {list.item_count === 1 ? "item" : "itens"} · criada em{" "}
                      {formatDate(list.created_at)}
                    </p>
                  </div>
                  <span className="text-neutral-400">→</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
