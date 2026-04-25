"use client";

import { useState, useTransition } from "react";
import { Heart, Award, Trash2 } from "lucide-react";
import { ThanksCard } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}時間前`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}日前`;
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

interface CardItemProps {
  card: ThanksCard;
  onToggleReact?: (cardId: string) => void;
  onDelete?: (cardId: string) => Promise<{ error?: string }>;
  showFrom?: boolean;
  showTo?: boolean;
  index?: number;
}

export default function CardItem({
  card,
  onToggleReact,
  onDelete,
  showFrom = true,
  showTo = true,
  index = 0,
}: CardItemProps) {
  const { currentUser } = useAuth();
  const hasReacted = card.reactedByMe;
  const [isDeleting, startDelete] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canDelete =
    !!onDelete &&
    !!currentUser &&
    (currentUser.id === card.from.id || currentUser.isAdmin);

  const handleConfirmDelete = () => {
    if (!onDelete) return;
    setDeleteError(null);
    startDelete(async () => {
      const res = await onDelete(card.id);
      if (res?.error) {
        setDeleteError(res.error);
      } else {
        setConfirmOpen(false);
      }
    });
  };

  return (
    <div
      className="animate-card-in bg-white rounded-2xl p-4 shadow-sm border border-[var(--color-warm-100)] hover:shadow-md transition-shadow"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 text-sm">
          {showFrom && (
            <span className="font-semibold text-[var(--color-warm-800)]">
              {card.from.name}
            </span>
          )}
          {showFrom && showTo && (
            <span className="text-[var(--color-warm-300)]">→</span>
          )}
          {showTo && (
            <span className="font-semibold text-[var(--color-primary)]">
              {card.to.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {card.isPicked && (
            <span className="text-amber-500" title="好事例">
              <Award className="w-4 h-4" />
            </span>
          )}
          <span className="text-xs text-[var(--color-warm-400)]">
            {timeAgo(card.createdAt)}
          </span>
          {canDelete && (
            <button
              onClick={() => {
                setDeleteError(null);
                setConfirmOpen(true);
              }}
              title="削除"
              className="text-[var(--color-warm-300)] hover:text-red-500 transition-colors p-0.5 -mr-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category badges (multiple) */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {card.categories.map((cat) => (
          <span
            key={cat.id}
            className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${cat.bgClass} ${cat.colorClass}`}
          >
            {cat.value}
          </span>
        ))}
      </div>

      {/* Message */}
      <p className="text-sm text-[var(--color-warm-800)] leading-relaxed mb-3">
        {card.message}
      </p>

      {/* Location tags + reaction */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 text-[10px]">
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-warm-50)] text-[var(--color-warm-500)] border border-[var(--color-warm-200)]">
            {card.from.location}
          </span>
          {card.to.location !== card.from.location && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--color-warm-50)] text-[var(--color-warm-500)] border border-[var(--color-warm-200)]">
              {card.to.location}
            </span>
          )}
        </div>
        <button
          onClick={() => onToggleReact?.(card.id)}
          className={`flex items-center gap-1 text-sm transition-all active:scale-110 ${
            hasReacted
              ? "text-pink-500"
              : "text-[var(--color-warm-300)] hover:text-pink-400"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${hasReacted ? "scale-110" : ""}`}
            fill={hasReacted ? "currentColor" : "none"}
          />
          {card.reactionCount > 0 && (
            <span className="text-xs">{card.reactionCount}</span>
          )}
        </button>
      </div>

      {/* Delete confirmation dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => !isDeleting && setConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-5 shadow-xl max-w-sm w-full border border-[var(--color-warm-100)]"
          >
            <h3 className="text-base font-bold text-[var(--color-warm-800)] mb-2">
              このカードを削除しますか？
            </h3>
            <p className="text-xs text-[var(--color-warm-500)] leading-relaxed mb-4">
              受け取った相手の履歴からも消えます。リアクションや既読情報も一緒に削除され、復元できません。
            </p>
            {deleteError && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">
                {deleteError}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                disabled={isDeleting}
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-[var(--color-warm-600)] bg-[var(--color-warm-50)] hover:bg-[var(--color-warm-100)] transition-colors disabled:opacity-40"
              >
                キャンセル
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40"
              >
                {isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
