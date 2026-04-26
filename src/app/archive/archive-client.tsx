"use client";

import { useState, useMemo, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Clock,
  Flame,
  Shuffle,
  Trophy,
  Award,
} from "lucide-react";
import AuthGuard from "@/components/auth-guard";
import CardItem from "@/components/card-item";
import { toggleReactionAction, deleteCardAction } from "@/lib/actions";
import { useRouter } from "next/navigation";
import type { ThanksCard, Employee } from "@/lib/types";

type SortMode = "new" | "hot" | "random";

function getMonthLabel(year: number, month: number): string {
  return `${year}年${month}月`;
}

function getAvailableMonths(
  cards: ThanksCard[]
): { year: number; month: number }[] {
  const set = new Set<string>();
  cards.forEach((c) => {
    const d = new Date(c.createdAt);
    set.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
  });
  return Array.from(set)
    .map((s) => {
      const [y, m] = s.split("-").map(Number);
      return { year: y, month: m };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface ArchiveClientProps {
  cards: ThanksCard[];
  employees: Employee[];
  currentUserId: string;
}

export default function ArchiveClient({
  cards: initialCards,
}: ArchiveClientProps) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [, startTransition] = useTransition();

  const handleDelete = async (cardId: string) => {
    const res = await deleteCardAction(cardId);
    if (!res.error) {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      router.refresh();
    }
    return res;
  };

  const availableMonths = useMemo(() => getAvailableMonths(cards), [cards]);
  const [monthIndex, setMonthIndex] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>("hot");
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const current = availableMonths[monthIndex];
  const hasPrev = monthIndex < availableMonths.length - 1;
  const hasNext = monthIndex > 0;

  const monthCards = useMemo(() => {
    if (!current) return [];
    return cards.filter((c) => {
      const d = new Date(c.createdAt);
      return (
        d.getFullYear() === current.year && d.getMonth() + 1 === current.month
      );
    });
  }, [cards, current]);

  const totalHearts = monthCards.reduce((sum, c) => sum + c.reactionCount, 0);

  const top3 = useMemo(
    () =>
      [...monthCards]
        .sort((a, b) => b.reactionCount - a.reactionCount)
        .slice(0, 3)
        .filter((c) => c.reactionCount > 0),
    [monthCards]
  );

  const top3Ids = useMemo(() => new Set(top3.map((c) => c.id)), [top3]);

  const sortedCards = useMemo(() => {
    if (sortMode === "hot") {
      return [...monthCards]
        .sort((a, b) => b.reactionCount - a.reactionCount)
        .filter((c) => !top3Ids.has(c.id));
    }
    if (sortMode === "random") {
      // Top3 も含めて全混ぜ（埋もれたカードの発掘目的）
      void shuffleSeed; // 再シャッフル用
      return shuffle(monthCards);
    }
    return monthCards;
  }, [monthCards, sortMode, top3Ids, shuffleSeed]);

  const handleToggleReact = (cardId: string) => {
    // Optimistic update
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const wasReacted = c.reactedByMe;
        return {
          ...c,
          reactionCount: c.reactionCount + (wasReacted ? -1 : 1),
          reactedByMe: !wasReacted,
        };
      })
    );
    startTransition(async () => {
      await toggleReactionAction(cardId);
    });
  };

  if (availableMonths.length === 0) {
    return (
      <AuthGuard>
        <div className="text-center py-20 text-[var(--color-warm-400)]">
          <p className="text-sm">まだカードがありません</p>
        </div>
      </AuthGuard>
    );
  }

  const getMedalColor = (index: number) => {
    if (index === 0) return "from-yellow-400 to-amber-500";
    if (index === 1) return "from-gray-300 to-gray-400";
    if (index === 2) return "from-amber-500 to-amber-700";
    return "";
  };

  const getMedalLabel = (index: number) => {
    if (index === 0) return "1st";
    if (index === 1) return "2nd";
    if (index === 2) return "3rd";
    return "";
  };

  return (
    <AuthGuard>
      {/* Month selector */}
      <div className="flex items-center justify-between mb-5">
        <button
          disabled={!hasPrev}
          onClick={() => setMonthIndex((i) => i + 1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[var(--color-warm-200)] text-[var(--color-warm-600)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-warm-50)] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-[var(--color-warm-800)]">
            {getMonthLabel(current.year, current.month)}
          </h2>
        </div>
        <button
          disabled={!hasNext}
          onClick={() => setMonthIndex((i) => i - 1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[var(--color-warm-200)] text-[var(--color-warm-600)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-warm-50)] transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Month summary */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-white rounded-2xl p-3 border border-[var(--color-warm-100)] text-center">
          <p className="text-xl font-bold text-[var(--color-primary)]">
            {monthCards.length}
          </p>
          <p className="text-[10px] text-[var(--color-warm-500)]">カード数</p>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-3 border border-[var(--color-warm-100)] text-center">
          <div className="flex items-center justify-center gap-1">
            <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />
            <p className="text-xl font-bold text-pink-500">{totalHearts}</p>
          </div>
          <p className="text-[10px] text-[var(--color-warm-500)]">
            みんなで選ぶグッドサンクス
          </p>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-3 border border-[var(--color-warm-100)] text-center">
          <p className="text-xl font-bold text-green-600">
            {new Set(monthCards.map((c) => c.from.id)).size}
          </p>
          <p className="text-[10px] text-[var(--color-warm-500)]">感謝を届けた人</p>
        </div>
      </div>

      {/* Top 3 podium */}
      {top3.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-[var(--color-warm-800)] mb-3 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            今月の注目カード
          </h3>
          <div className="space-y-2">
            {top3.map((card, i) => {
              const hasReacted = card.reactedByMe;
              const cardDate = new Date(card.createdAt);
              const dateLabel = `${cardDate.getMonth() + 1}月`;
              return (
                <div
                  key={card.id}
                  className="animate-card-in bg-white rounded-2xl overflow-hidden border border-[var(--color-warm-100)] hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className={`h-1 bg-gradient-to-r ${getMedalColor(i)}`}
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${getMedalColor(i)} flex items-center justify-center`}
                        >
                          <span className="text-white text-[10px] font-bold">
                            {getMedalLabel(i)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm flex-wrap">
                          <span className="inline-flex items-baseline gap-1">
                            <span className="text-[10px] text-[var(--color-warm-400)] font-normal">
                              {card.from.location}
                            </span>
                            <span className="font-semibold text-[var(--color-warm-800)]">
                              {card.from.name}
                            </span>
                          </span>
                          <span className="text-[var(--color-warm-300)]">
                            →
                          </span>
                          <span className="inline-flex items-baseline gap-1">
                            <span className="text-[10px] text-[var(--color-warm-400)] font-normal">
                              {card.to.location}
                            </span>
                            <span className="font-semibold text-[var(--color-primary)]">
                              {card.to.name}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {card.isPicked && (
                          <span className="text-amber-500" title="好事例">
                            <Award className="w-4 h-4" />
                          </span>
                        )}
                        <span className="text-xs text-[var(--color-warm-400)]">
                          {dateLabel}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--color-warm-800)] leading-relaxed mb-2.5">
                      {card.message}
                    </p>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleToggleReact(card.id)}
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
                        <span className="text-xs font-medium">
                          {card.reactionCount}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sort toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-[var(--color-warm-100)] rounded-lg p-0.5">
          <button
            onClick={() => setSortMode("hot")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              sortMode === "hot"
                ? "bg-white text-[var(--color-primary)] shadow-sm"
                : "text-[var(--color-warm-500)]"
            }`}
          >
            <Flame className="w-3 h-3" />
            注目順
          </button>
          <button
            onClick={() => setSortMode("new")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              sortMode === "new"
                ? "bg-white text-[var(--color-primary)] shadow-sm"
                : "text-[var(--color-warm-500)]"
            }`}
          >
            <Clock className="w-3 h-3" />
            新着順
          </button>
          <button
            onClick={() => {
              if (sortMode === "random") {
                setShuffleSeed((s) => s + 1);
              } else {
                setSortMode("random");
              }
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              sortMode === "random"
                ? "bg-white text-[var(--color-primary)] shadow-sm"
                : "text-[var(--color-warm-500)]"
            }`}
            title={sortMode === "random" ? "もう一度シャッフル" : "ランダム表示"}
          >
            <Shuffle className="w-3 h-3" />
            ランダム
          </button>
        </div>
        <p className="text-[10px] text-[var(--color-warm-400)] flex items-center gap-1">
          <Heart className="w-3 h-3 text-pink-500" fill="currentColor" />
          ハートでグッドサンクスに投票
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {sortedCards.map((card, i) => (
          <CardItem
            key={card.id}
            card={card}
            onToggleReact={handleToggleReact}
            onDelete={handleDelete}
            index={i}
          />
        ))}
      </div>
    </AuthGuard>
  );
}
