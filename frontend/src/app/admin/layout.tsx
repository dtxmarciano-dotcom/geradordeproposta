"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { VanttaLogo } from "@/components/brand/VanttaLogo";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/useRequireAuth";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/supermarkets", label: "Supermercados" },
  { href: "/admin/users", label: "Usuários" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useRequireAuth("admin");
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-border px-6 py-6 md:w-60 md:border-b-0 md:border-r">
        <VanttaLogo />
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-vantta-100 text-vantta-800"
                    : "text-neutral-600 hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden flex-col gap-2 md:flex">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="truncate text-xs text-neutral-500">{user.email}</p>
          <Button variant="secondary" size="sm" onClick={logout} className="mt-1">
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4 md:hidden">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <Button variant="ghost" size="sm" onClick={logout}>
            Sair
          </Button>
        </header>
        <main className="flex-1 px-6 py-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
