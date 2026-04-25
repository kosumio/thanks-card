"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NavBar from "./nav-bar";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin }: AuthGuardProps) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login");
    }
  }, [isLoading, currentUser, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[var(--color-warm-200)] border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (requireAdmin && !currentUser.isAdmin) {
    return (
      <>
        <NavBar />
        <main className="pt-14 pb-20">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="text-center py-20 text-[var(--color-warm-500)]">
              <p className="text-sm">このページは管理者のみアクセスできます</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="pt-14 pb-20">
        <div className="max-w-lg mx-auto px-4 py-4">{children}</div>
      </main>
    </>
  );
}
