"use client";

import { useState, useMemo, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Clock,
  Flame,
  Trophy,
  MapPin,
  Award,
} from "lucide-react";
import AuthGuard from "@/components/auth-guard";
import CardItem from "@/components/card-item";
import { toggleReactionAction } from "@/lib/actions";
import type { ThanksCard, Employee, CategoryInfo } from "@/lib/types";

type SortMode = "new" | "hot";
type LocationTab = "received" | "sent" | "hearts";

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

interface ArchiveClientProps {
  cards: ThanksCard[];
  employees: Employee[];
  categories: CategoryInfo[];
  currentUserId: string;
}

export default function ArchiveClient({
  cards: initialCards,
  employees,
  categories,
  currentUserId,
}: ArchiveClientProps) {
  const [cards, setCards] = useState(initialCards);
  const [, startTransition] = useTransition();

  const availableMonths = useMemo(() => getAvailableMonths(cards), [cards]);
  const [monthIndex, setMonthIndex] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>("hot");
  const [locationTab, setLocationTab] = useState<LocationTab>("received");

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
    return monthCards;
  }, [monthCards, sortMode, top3Ids]);

  // Derive unique locations from employees
  const locations = useMemo(() => {
    const locs = new Set(employees.map((e) => e.location));
    return Array.from(locs);
  }, [employees]);

  const locationStats = useMemo(() => {
    return locations.map((loc) => {
      const catReceived: Record<string, number> = {};
      const catSent: Record<string, number> = {};
      const catHearts: Record<string, number> = {};
      categories.forEach((c) => {
        catReceived[c.value] = 0;
        catSent[c.value] = 0;
        catHearts[c.value] = 0;
      });

      let totalReceived = 0;
      let totalSent = 0;
      let locTotalHearts = 0;

      monthCards.forEach((card) => {
        const fromLoc = card.from.location;
        const toLoc = card.to.location;

        if (toLoc === loc) {
          totalReceived++;
          card.categories.forEach((cat) => {
            catReceived[cat.value]++;
          });
        }
        if (fromLoc === loc) {
          totalSent++;
          card.categories.forEach((cat) => {
            catSent[cat.value]++;
          });
        }
        if (toLoc === loc) {
          locTotalHearts += card.reactionCount;
          card.categories.forEach((cat) => {
            catHearts[cat.value] += card.reactionCount;
          });
        }
      });

      return {
        location: loc,
        totalReceived,
        totalSent,
        totalHearts: locTotalHearts,
        catReceived,
        catSent,
        catHearts,
      };
    });
  }, [monthCards, locations, categories]);

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
          <p className="text-xs text-[var(--color-warm-400)] mt-0.5">
            {monthCards.length} 枚のカード
          </p>
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
            グッドサンクス
          </p>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-3 border border-[var(--color-warm-100)] text-center">
          <p className="text-xl font-bold text-green-600">
            {new Set(monthCards.map((c) => c.from.id)).size}
          </p>
          <p className="text-[10px] text-[var(--color-warm-500)]">投稿者数</p>
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
              const dateLabel = cardDate.toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
              });
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
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-semibold text-[var(--color-warm-800)]">
                            {card.from.name}
                          </span>
                          <span className="text-[var(--color-warm-300)]">
                            →
                          </span>
                          <span className="font-semibold text-[var(--color-primary)]">
                            {card.to.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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

                    <div className="flex flex-wrap gap-1 mb-2">
                      {card.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${cat.bgClass} ${cat.colorClass}`}
                        >
                          {cat.value}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm text-[var(--color-warm-800)] leading-relaxed mb-2.5">
                      {card.message}
                    </p>

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

      {/* Location stats */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[var(--color-warm-800)] mb-3 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
          拠点別集計
        </h3>
        <div className="flex bg-[var(--color-warm-100)] rounded-lg p-0.5 mb-3">
          {(
            [
              { key: "received" as LocationTab, label: "もらった" },
              { key: "sent" as LocationTab, label: "贈った" },
              { key: "hearts" as LocationTab, label: "グッドサンクス" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setLocationTab(t.key)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                locationTab === t.key
                  ? "bg-white text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-warm-500)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-[var(--color-warm-100)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-warm-100)]">
                  <th className="text-left py-2 px-3 font-medium text-[var(--color-warm-500)]">
                    拠点
                  </th>
                  {categories.map((cat) => (
                    <th
                      key={cat.id}
                      className={`py-2 px-1.5 font-medium text-center ${cat.colorClass}`}
                      title={cat.value}
                    >
                      {cat.icon}
                    </th>
                  ))}
                  <th className="py-2 px-3 font-bold text-center text-[var(--color-warm-700)]">
                    合計
                  </th>
                </tr>
              </thead>
              <tbody>
                {locationStats.map((stat) => {
                  const catData =
                    locationTab === "received"
                      ? stat.catReceived
                      : locationTab === "sent"
                        ? stat.catSent
                        : stat.catHearts;
                  const total =
                    locationTab === "received"
                      ? stat.totalReceived
                      : locationTab === "sent"
                        ? stat.totalSent
                        : stat.totalHearts;
                  return (
                    <tr
                      key={stat.location}
                      className="border-b border-[var(--color-warm-50)] last:border-b-0"
                    >
                      <td className="py-2 px-3 font-medium text-[var(--color-warm-700)]">
                        {stat.location}
                      </td>
                      {categories.map((cat) => (
                        <td
                          key={cat.id}
                          className="py-2 px-1.5 text-center text-[var(--color-warm-600)]"
                        >
                          {catData[cat.value] || "-"}
                        </td>
                      ))}
                      <td className="py-2 px-3 text-center font-bold text-[var(--color-primary)]">
                        {total}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-[var(--color-warm-50)]">
                  <td className="py-2 px-3 font-bold text-[var(--color-warm-800)]">
                    合計
                  </td>
                  {categories.map((cat) => {
                    const colTotal = locationStats.reduce((sum, s) => {
                      const d =
                        locationTab === "received"
                          ? s.catReceived
                          : locationTab === "sent"
                            ? s.catSent
                            : s.catHearts;
                      return sum + d[cat.value];
                    }, 0);
                    return (
                      <td
                        key={cat.id}
                        className="py-2 px-1.5 text-center font-bold text-[var(--color-warm-700)]"
                      >
                        {colTotal || "-"}
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-center font-bold text-[var(--color-primary)]">
                    {locationStats.reduce((sum, s) => {
                      return (
                        sum +
                        (locationTab === "received"
                          ? s.totalReceived
                          : locationTab === "sent"
                            ? s.totalSent
                            : s.totalHearts)
                      );
                    }, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map((cat) => (
            <span key={cat.id} className={`text-[10px] ${cat.colorClass}`}>
              {cat.icon} {cat.value}
            </span>
          ))}
        </div>
      </div>

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
        </div>
        <p className="text-[10px] text-[var(--color-warm-400)] flex items-center gap-1">
          <Heart className="w-3 h-3 text-pink-500" fill="currentColor" />
          ハートで投票
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {sortedCards.map((card, i) => (
          <CardItem
            key={card.id}
            card={card}
            onToggleReact={handleToggleReact}
            index={i}
          />
        ))}
      </div>
    </AuthGuard>
  );
}
