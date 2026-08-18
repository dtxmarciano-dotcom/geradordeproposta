"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { PublicUser } from "./api";

// Guarda de UI apenas: esconde/redireciona no cliente para melhorar a
// experiência. A proteção de verdade é feita pelo backend (middlewares
// authenticate/requireRole), que rejeita qualquer chamada sem um JWT válido
// independente do que essa tela mostrar.
export function useRequireAuth(requiredRole?: PublicUser["role"]) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [isLoading, token, user, requiredRole, router]);

  return { user, isLoading };
}
