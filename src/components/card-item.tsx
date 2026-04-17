"use client";

import { Heart, Award } from "lucide-react";
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
  onToggleReact?: (cardId: string, currentlyReacted: boolean) => void;
  showFrom?: boolean;
  showTo?: boolean;
  index?: number;
}

export default function CardItem({
  card,
  onToggleReact,
  showFrom = true,
  showTo = true,
  index = 0,
}: CardItemProps) {
  const { currentUser } = useAuth();
  const hasReacted = card.reactedByMe;

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
          onClick={() => onToggleReact?.(card.id, hasReacted)}
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
    </div>
  );
}
