"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Laptop } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrated, isAuthenticated } = useSession();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Laptop className="size-4" />
          </div>
          Checking session…
        </div>
      </div>
    );
  }

  return children;
}
