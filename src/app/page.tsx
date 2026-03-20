"use client";

import { useState, useMemo } from "react";
import { Send, CheckCircle, Sparkles } from "lucide-react";
import AuthGuard from "@/components/auth-guard";
import EmployeeSuggest from "@/components/employee-suggest";
import { useAuth } from "@/lib/auth-context";
import { CATEGORIES, employees, thanksCards } from "@/lib/mock-data";
import type { Category, Employee } from "@/lib/types";
import { MAX_MESSAGE_LENGTH } from "@/lib/types";

export default function HomePage() {
  const { currentUser } = useAuth();
  const [toEmployee, setToEmployee] = useState<Employee | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  // サジェスト: よく送る相手（頻出送り先）+ まだ届いていない人
  const { frequents, discovers } = useMemo(() => {
    if (!currentUser) return { frequents: [] as Employee[], discovers: [] as Employee[] };

    // 自分がよく送る相手（頻度順）
    const sentCounts: Record<string, number> = {};
    thanksCards.forEach((c) => {
      if (c.fromId === currentUser.id) {
        sentCounts[c.toId] = (sentCounts[c.toId] || 0) + 1;
      }
    });
    const freqs = Object.entries(sentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => employees.find((e) => e.id === id))
      .filter((e): e is Employee => !!e);

    // 同じ拠点でカードをあまりもらっていない人
    const receivedCounts: Record<string, number> = {};
    thanksCards.forEach((c) => {
      receivedCounts[c.toId] = (receivedCounts[c.toId] || 0) + 1;
    });
    const freqIds = new Set(freqs.map((e) => e.id));
    const discs = employees
      .filter(
        (e) =>
          e.id !== currentUser.id &&
          !freqIds.has(e.id) &&
          e.location === currentUser.location
      )
      .sort((a, b) => (receivedCounts[a.id] || 0) - (receivedCounts[b.id] || 0))
      .slice(0, 2);

    return { frequents: freqs, discovers: discs };
  }, [currentUser]);
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    toEmployee && selectedCategories.length > 0 && message.trim().length > 0;

  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleMessageChange = (text: string) => {
    if (text.length <= MAX_MESSAGE_LENGTH) {
      setMessage(text);
    }
  };

  const handleSubmitClick = () => {
    if (!canSubmit) return;
    setShowConfirm(true);
  };

  const handleConfirmSend = () => {
    setShowConfirm(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setToEmployee(null);
      setSelectedCategories([]);
      setMessage("");
    }, 2500);
  };

  if (submitted) {
    return (
      <AuthGuard>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-card-in text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--color-warm-800)] mb-2">
              送信しました!
            </h2>
            <p className="text-sm text-[var(--color-warm-500)]">
              {toEmployee?.name} さんに感謝が届きました
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <h2 className="text-lg font-bold text-[var(--color-warm-800)] mb-6">
        サンクスカードを書く
      </h2>

      <div className="space-y-5">
        {/* クイックサジェスト（入力欄の前に表示） */}
        {!toEmployee && (frequents.length > 0 || discovers.length > 0) && (
            <div className="mt-2.5 space-y-2.5">
              {frequents.length > 0 && (
                <div>
                  <p className="text-[10px] text-[var(--color-warm-500)] mb-1.5">
                    いつも助けてくれるこの人に、今日も感謝を届けませんか?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {frequents.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setToEmployee(e)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--color-warm-50)] border border-[var(--color-primary)]/30 text-[var(--color-primary)] font-medium hover:bg-[var(--color-warm-100)] transition-colors"
                      >
                        {e.name}
                        <span className="text-[var(--color-warm-400)] font-normal ml-1">
                          {e.location}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {discovers.length > 0 && (
                <div>
                  <p className="text-[10px] text-[var(--color-warm-400)] mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    この人にも感謝を届けてみませんか?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {discovers.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setToEmployee(e)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-[var(--color-warm-200)] text-[var(--color-warm-700)] hover:bg-[var(--color-warm-50)] hover:border-[var(--color-primary)] transition-colors"
                      >
                        {e.name}
                        <span className="text-[var(--color-warm-400)] ml-1">
                          {e.location}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* To - suggest input */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-warm-700)] mb-1.5">
            誰に送る?
          </label>
          <EmployeeSuggest
            excludeId={currentUser?.id}
            value={toEmployee}
            onChange={setToEmployee}
            placeholder="名前を入力してください"
          />
        </div>

        {/* Category - multiple select */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-warm-700)] mb-2">
            カテゴリ（複数選択可）
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`text-xs px-3.5 py-2 rounded-xl font-medium transition-all ${
                    isSelected
                      ? `${cat.bg} ${cat.color} ring-2 ring-current shadow-sm`
                      : "bg-[var(--color-warm-50)] text-[var(--color-warm-500)] border border-[var(--color-warm-200)] hover:bg-[var(--color-warm-100)]"
                  }`}
                >
                  {cat.icon} {cat.value}
                </button>
              );
            })}
          </div>
        </div>

        {/* Message with char limit */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-warm-700)] mb-1.5">
            ありがとうの内容
          </label>
          <textarea
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            placeholder="感謝のメッセージを書いてください..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[var(--color-warm-200)] bg-white text-[var(--color-warm-800)] text-sm placeholder:text-[var(--color-warm-300)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors resize-none"
          />
          <div className="flex justify-between mt-1">
            <p className="text-[10px] text-[var(--color-warm-400)]">
              相手に伝わるように具体的に書くと喜ばれます
            </p>
            <p
              className={`text-[10px] font-medium ${
                message.length > MAX_MESSAGE_LENGTH * 0.9
                  ? "text-red-500"
                  : "text-[var(--color-warm-400)]"
              }`}
            >
              {message.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          disabled={!canSubmit}
          onClick={handleSubmitClick}
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          感謝を届ける
        </button>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && toEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="animate-card-in bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-[var(--color-warm-800)] mb-3">
              この方に届けます
            </h3>
            <div className="bg-[var(--color-warm-50)] rounded-xl p-4 mb-4">
              <p className="text-lg font-bold text-[var(--color-primary)]">
                {toEmployee.name}
              </p>
              <p className="text-xs text-[var(--color-warm-500)] mt-0.5">
                {toEmployee.location}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCategories.map((cat) => {
                  const info = CATEGORIES.find((c) => c.value === cat);
                  return (
                    <span
                      key={cat}
                      className={`text-[10px] px-2 py-0.5 rounded-full ${info?.bg} ${info?.color}`}
                    >
                      {cat}
                    </span>
                  );
                })}
              </div>
              <p className="text-sm text-[var(--color-warm-700)] mt-3 leading-relaxed">
                {message}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[var(--color-warm-600)] bg-[var(--color-warm-100)] hover:bg-[var(--color-warm-200)] transition-colors"
              >
                修正する
              </button>
              <button
                onClick={handleConfirmSend}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:shadow-lg transition-all active:scale-[0.98]"
              >
                送信する
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
