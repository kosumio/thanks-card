"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PenSquare,
  User,
  Trophy,
  CalendarDays,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", icon: PenSquare, label: "書く" },
  { href: "/archive", icon: CalendarDays, label: "全部見る" },
  { href: "/my", icon: User, label: "マイページ" },
  { href: "/ranking", icon: Trophy, label: "ランキング" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  return (
    <>
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[var(--color-warm-200)]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-[var(--color-warm-800)]">
            Thanks Card
          </h1>
          <div className="flex items-center gap-3">
            {currentUser?.isAdmin && (
              <Link
                href="/admin"
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--color-warm-100)] text-[var(--color-warm-700)] hover:bg-[var(--color-warm-200)] transition-colors"
              >
                <BarChart3 className="inline w-3.5 h-3.5 mr-1" />
                管理
              </Link>
            )}
            <span className="text-sm text-[var(--color-warm-600)]">
              {currentUser?.name}
            </span>
            <button
              onClick={() => logout()}
              className="text-[var(--color-warm-400)] hover:text-[var(--color-warm-600)] transition-colors"
              title="ログアウト"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[var(--color-warm-200)]">
        <div className="max-w-lg mx-auto flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2.5 transition-colors ${
                  active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-warm-400)] hover:text-[var(--color-warm-600)]"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
