"use client";

import Link from "next/link";
import { VanttaLogo } from "@/components/brand/VanttaLogo";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";

export function AppHeader() {
  const { logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/dashboard">
        <VanttaLogo />
      </Link>
      <Button variant="ghost" size="sm" onClick={logout}>
        Sair
      </Button>
    </header>
  );
}
