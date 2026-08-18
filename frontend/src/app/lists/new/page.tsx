"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { ApiError, createShoppingList } from "@/lib/api";

export default function NewListPage() {
  const { isLoading: authLoading } = useRequireAuth("user");
  const { user, token } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const list = await createShoppingList(token, title.trim() || undefined);
      router.push(`/lists/${list.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a lista.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-12">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova lista de compras</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Dê um nome para sua lista. Você poderá adicionar os itens em seguida.
          </p>
        </div>

        <Card>
          {error ? (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          ) : null}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nome da lista"
              placeholder="Ex.: Compra do mês"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar lista"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
