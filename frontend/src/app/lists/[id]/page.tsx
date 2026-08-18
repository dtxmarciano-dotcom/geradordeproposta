"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  addShoppingListItem,
  ApiError,
  deleteShoppingListItem,
  getShoppingList,
  ShoppingList,
  ShoppingListItem,
  updateShoppingListItem,
} from "@/lib/api";

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading: authLoading } = useRequireAuth("user");
  const { user, token } = useAuth();

  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newProductName, setNewProductName] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [isAdding, setIsAdding] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getShoppingList(token, id);
      setList(data.list);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar a lista.");
    } finally {
      setIsLoading(false);
    }
  }, [token, id]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleAddItem(event: FormEvent) {
    event.preventDefault();
    if (!token || !id || !newProductName.trim()) return;
    setIsAdding(true);
    setError(null);
    try {
      const quantity = Number(newQuantity.replace(",", "."));
      await addShoppingListItem(token, id, {
        product_name: newProductName.trim(),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      });
      setNewProductName("");
      setNewQuantity("1");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível adicionar o item.");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!token || !id) return;
    setError(null);
    try {
      await deleteShoppingListItem(token, id, itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover o item.");
    }
  }

  async function handleUpdateQuantity(itemId: string, quantity: number) {
    if (!token || !id || quantity <= 0) return;
    try {
      const updated = await updateShoppingListItem(token, id, itemId, { quantity });
      setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível atualizar a quantidade.");
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
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !list ? (
          <Alert variant="error">Não foi possível carregar esta lista.</Alert>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {list.title || "Lista sem nome"}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {items.length} {items.length === 1 ? "item" : "itens"} na lista
              </p>
            </div>

            {error ? <Alert variant="error">{error}</Alert> : null}

            <Card>
              <form onSubmit={handleAddItem} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[180px] flex-1">
                  <Input
                    label="Produto"
                    placeholder="Ex.: contra filé"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    disabled={isAdding}
                  />
                </div>
                <div className="w-24">
                  <Input
                    label="Qtd."
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    disabled={isAdding}
                  />
                </div>
                <Button type="submit" disabled={isAdding || !newProductName.trim()}>
                  {isAdding ? "Adicionando..." : "Adicionar"}
                </Button>
              </form>
            </Card>

            {items.length === 0 ? (
              <EmptyState
                title="Sua lista está vazia"
                description="Adicione os produtos que você costuma comprar para comparar preços."
              />
            ) : (
              <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onRemove={() => handleRemoveItem(item.id)}
                    onQuantityChange={(q) => handleUpdateQuantity(item.id, q)}
                  />
                ))}
              </div>
            )}

            <div className="sticky bottom-6 flex justify-center pt-2">
              <LinkButton
                href={`/lists/${list.id}/compare`}
                size="lg"
                className="w-full justify-center shadow-lg shadow-vantta-900/20 sm:w-auto sm:px-10"
              >
                Comparar preços
              </LinkButton>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ItemRow({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: ShoppingListItem;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(item.quantity);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="flex-1 text-sm font-medium text-foreground">{item.product_name}</span>
      <input
        type="number"
        min="0.001"
        step="0.001"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        onBlur={() => {
          const parsed = Number(quantity.replace(",", "."));
          if (Number.isFinite(parsed) && parsed > 0) onQuantityChange(parsed);
        }}
        aria-label={`Quantidade de ${item.product_name}`}
        className="w-20 rounded-lg border border-border bg-surface px-2 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-vantta-400"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${item.product_name}`}
        className="min-h-9 min-w-9 rounded-lg px-2 py-2 text-sm text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        Remover
      </button>
    </div>
  );
}
