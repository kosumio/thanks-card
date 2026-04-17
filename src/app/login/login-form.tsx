"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  const { refreshUser } = useAuth();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = employeeNumber.trim() && birthdate.trim() && !isPending;

  const handleLogin = () => {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("employeeNumber", employeeNumber.trim());
      formData.set("birthdate", birthdate.trim());
      const result = await loginAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        await refreshUser();
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
            {/* Employee number */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-warm-700)] mb-1.5">
                従業員番号
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={employeeNumber}
                onChange={(e) => {
                  setEmployeeNumber(e.target.value);
                  setError(null);
                }}
                placeholder="例: 1001"
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-warm-200)] bg-[var(--color-warm-50)] text-[var(--color-warm-800)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-warm-300)]"
              />
            </div>

            {/* Birthdate */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-warm-700)] mb-1.5">
                生年月日
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => {
                  setBirthdate(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-warm-200)] bg-[var(--color-warm-50)] text-[var(--color-warm-800)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-warm-300)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
              <p className="text-[10px] text-[var(--color-warm-400)] mt-1">
                例: 1990年1月15日の場合 → 1990-01-15
              </p>
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
