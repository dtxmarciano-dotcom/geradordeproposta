"use client";

import { VanttaLogo } from "@/components/brand/VanttaLogo";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function AdminHomePage() {
  const { isLoading } = useRequireAuth("admin");
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
            Painel administrativo. Cadastro de supermercados, upload de planilhas e gestão de
            usuários chegam nas próximas etapas de interface.
          </p>
        </div>

        <EmptyState
          title="Nenhum supermercado cadastrado ainda"
          description="A tela de cadastro de supermercados e upload de planilhas de preço é a próxima etapa do frontend."
        />
      </main>
    </div>
  );
}
