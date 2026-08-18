"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/lib/auth-context";
import { listSupermarkets, listUsers, ApiError } from "@/lib/api";

export default function AdminHomePage() {
  const { user, token } = useAuth();
  const [supermarketCount, setSupermarketCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    Promise.all([listSupermarkets(token), listUsers(token)])
      .then(([supermarkets, users]) => {
        setSupermarketCount(supermarkets.length);
        setUserCount(users.length);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar o resumo.");
      });
  }, [token]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bem-vindo(a), {user?.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Painel administrativo do Vantta: gerencie supermercados, planilhas de preço e usuários.
        </p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/supermarkets">
          <Card className="flex flex-col gap-2 transition-shadow hover:shadow-md">
            <p className="text-sm text-neutral-500">Supermercados cadastrados</p>
            {supermarketCount === null && !error ? (
              <Spinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-foreground">{supermarketCount ?? "—"}</p>
            )}
          </Card>
        </Link>
        <Link href="/admin/users">
          <Card className="flex flex-col gap-2 transition-shadow hover:shadow-md">
            <p className="text-sm text-neutral-500">Usuários cadastrados</p>
            {userCount === null && !error ? (
              <Spinner size="sm" />
            ) : (
              <p className="text-3xl font-bold text-foreground">{userCount ?? "—"}</p>
            )}
          </Card>
        </Link>
      </div>
    </div>
  );
}
