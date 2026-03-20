"use client";

import { useAuth } from "@/lib/auth-context";
import NavBar from "./nav-bar";
import LoginPage from "@/app/login/login-form";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[var(--color-warm-200)] border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
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
