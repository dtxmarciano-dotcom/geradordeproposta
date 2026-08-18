"use client";

import { VanttaLogo } from "@/components/brand/VanttaLogo";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function DashboardPage() {
  const { isLoading } = useRequireAuth("user");
  const { user, logout } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <VanttaLogo />
        <Button variant="ghost" size="sm" onClick={logout}>
          Sair
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo(a), {user.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Suas listas de compras e a comparação de preços chegam em uma próxima etapa.
          </p>
        </div>

        <EmptyState
          title="Você ainda não criou nenhuma lista"
          description="Monte sua primeira lista de compras para comparar preços entre os supermercados cadastrados."
        />
      </main>
    </div>
  );
}
