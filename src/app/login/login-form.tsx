"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { loginAction } from "@/lib/actions";
import EmployeeSuggest from "@/components/employee-suggest";
import type { Employee } from "@/lib/types";

interface LoginPageProps {
  employees: Employee[];
}

export default function LoginPage({ employees }: LoginPageProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [selected, setSelected] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = !!selected && !isPending;

  const handleLogin = () => {
    if (!canSubmit || !selected) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("employeeId", selected.id);
      const result = await loginAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        await refreshUser();
        router.replace("/");
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-[var(--color-warm-50)] to-[var(--color-bg)]">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] shadow-lg mb-4">
            <Heart className="w-10 h-10 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-warm-800)]">
            Thanks Card
          </h1>
          <p className="text-sm text-[var(--color-warm-500)] mt-1">
            感謝を届けよう
          </p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-warm-100)]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-warm-700)] mb-1.5">
                お名前
              </label>
              <EmployeeSuggest
                employees={employees}
                value={selected}
                onChange={(emp) => {
                  setSelected(emp);
                  setError(null);
                }}
                placeholder="名前またはふりがなを入力"
              />
              <ul className="text-[10px] text-[var(--color-warm-400)] mt-1.5 space-y-0.5 leading-relaxed">
                <li>・ 漢字 / ひらがな / 従業員番号、どれでも検索できます</li>
                <li>・ 異体字（齋 / 齊 / 斉 など）や全角空白の有無は気にしなくてOK</li>
                <li>・ 同姓同名がいるときは <span className="text-[var(--color-warm-600)] font-medium">所属</span> で見分けて選んでください</li>
              </ul>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Login button */}
            <button
              disabled={!canSubmit}
              onClick={handleLogin}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isPending ? "ログイン中..." : "ログイン"}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--color-warm-400)] mt-6">
          Powered by 天神経営
        </p>
      </div>
    </div>
  );
}
