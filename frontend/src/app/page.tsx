"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    router.replace(user.role === "admin" ? "/admin" : "/dashboard");
  }, [isLoading, token, user, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner />
    </div>
  );
}
