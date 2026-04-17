"use client";

import { useState, useMemo } from "react";
import { Heart, Inbox, Send, Trophy } from "lucide-react";
import AuthGuard from "@/components/auth-guard";
import type { ThanksCard, Employee, CategoryInfo } from "@/lib/types";

type RankingType = "received" | "sent" | "hearts";

interface PersonRank {
  id: string;
  name: string;
  location: string;
  count: number;
}

interface RankingClientProps {
  cards: ThanksCard[];
  employees: Employee[];
  categories: CategoryInfo[];
  currentUserId: string;
}

export default function RankingClient({
  cards,
  employees,
  categories,
  currentUserId,
}: RankingClientProps) {
  const [tab, setTab] = useState<RankingType>("received");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  function buildFullRanking(
    type: RankingType,
    catFilter?: string
  ): PersonRank[] {
    const counts: Record<string, number> = {};
    const filtered = catFilter
      ? cards.filter((c) =>
          c.categories.some((cc) => cc.value === catFilter)
        )
      : cards;

    filtered.forEach((c) => {
      if (type === "received") {
        counts[c.to.id] = (counts[c.to.id] || 0) + 1;
      } else if (type === "sent") {
        counts[c.from.id] = (counts[c.from.id] || 0) + 1;
      } else {
        counts[c.to.id] = (counts[c.to.id] || 0) + c.reactionCount;
      }
    });

    return employees
      .map((e) => ({
        id: e.id,
        name: e.name,
        location: e.location,
        count: counts[e.id] || 0,
      }))
      .filter((e) => e.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  const fullRanking = useMemo(
    () => buildFullRanking(tab, categoryFilter ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, categoryFilter, cards, employees]
  );
  const currentRanking = fullRanking.slice(0, 10);

  const myRank = useMemo(() => {
    const idx = fullRanking.findIndex((r) => r.id === currentUserId);
    if (idx < 0) return null;
    return {
      rank: idx + 1,
      count: fullRanking[idx].count,
      total: fullRanking.length,
    };
  }, [fullRanking, currentUserId]);

  const getMedalColor = (index: number) => {
    if (index === 0) return "text-yellow-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-amber-600";
    return "text-transparent";
  };

  const tabs = [
    { key: "received" as const, label: "もらった", icon: Inbox, unit: "枚" },
    { key: "sent" as const, label: "贈った", icon: Send, unit: "枚" },
    {
      key: "hearts" as const,
      label: "グッドサンクス",
      icon: Heart,
      unit: "",
    },
  ];

  const currentTab = tabs.find((t) => t.key === tab)!;
  const activeCat = categories.find((c) => c.value === categoryFilter);
  const rankingLabel = activeCat
    ? `${activeCat.icon} ${categoryFilter}`
    : "総合";

  return (
    <AuthGuard>
      <h2 className="text-lg font-bold text-[var(--color-warm-800)] mb-4">
        ランキング
      </h2>

      {/* Tab */}
      <div className="flex bg-[var(--color-warm-100)] rounded-xl p-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.key
                ? "bg-white text-[var(--color-primary)] shadow-sm"
                : "text-[var(--color-warm-500)]"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
            categoryFilter === null
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "bg-[var(--color-warm-50)] text-[var(--color-warm-500)] border border-[var(--color-warm-200)] hover:bg-[var(--color-warm-100)]"
          }`}
        >
          総合
        </button>
        {categories.map((cat) => {
          const isActive = categoryFilter === cat.value;
          return (
            <button
              key={cat.id}
              onClick={() =>
                setCategoryFilter(isActive ? null : cat.value)
              }
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? `${cat.bgClass} ${cat.colorClass} ring-2 ring-current shadow-sm`
                  : "bg-[var(--color-warm-50)] text-[var(--color-warm-500)] border border-[var(--color-warm-200)] hover:bg-[var(--color-warm-100)]"
              }`}
            >
              {cat.icon} {cat.value}
            </button>
          );
        })}
      </div>

      {/* My rank */}
      {myRank && (
        <div className="mb-4 bg-gradient-to-r from-[var(--color-warm-50)] to-white rounded-2xl p-4 border border-[var(--color-primary)]/20">
          <p className="text-[10px] text-[var(--color-warm-500)] mb-1">
            あなたは現在
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[var(--color-primary)]">
                {myRank.rank}
              </span>
              <span className="text-sm text-[var(--color-warm-600)]">位</span>
              <span className="text-xs text-[var(--color-warm-400)] ml-1">
                / {myRank.total}人中
              </span>
            </div>
            <div className="flex items-center gap-1">
              {tab === "hearts" && (
                <Heart
                  className="w-4 h-4 text-pink-500"
                  fill="currentColor"
                />
              )}
              <span
                className={`text-lg font-bold ${tab === "hearts" ? "text-pink-500" : "text-[var(--color-primary)]"}`}
              >
                {myRank.count}
              </span>
              {currentTab.unit && (
                <span className="text-[10px] text-[var(--color-warm-400)]">
                  {currentTab.unit}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ranking list */}
      <h3 className="text-sm font-semibold text-[var(--color-warm-800)] mb-3 flex items-center gap-1.5">
        <Trophy className="w-4 h-4 text-amber-500" />
        {rankingLabel} TOP10
      </h3>
      <div className="space-y-2">
        {currentRanking.length === 0 && (
          <p className="text-center py-8 text-sm text-[var(--color-warm-400)]">
            該当するカードがありません
          </p>
        )}
        {currentRanking.map((r, i) => (
          <div
            key={r.id}
            className="animate-card-in flex items-center bg-white rounded-xl px-4 py-3 border border-[var(--color-warm-100)]"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="w-8 text-center">
              {i < 3 ? (
                <Trophy
                  className={`w-5 h-5 mx-auto ${getMedalColor(i)}`}
                />
              ) : (
                <span className="text-sm text-[var(--color-warm-400)]">
                  {i + 1}
                </span>
              )}
            </div>
            <div className="flex-1 ml-3">
              <p className="text-sm font-semibold text-[var(--color-warm-800)]">
                {r.name}
              </p>
              <p className="text-[10px] text-[var(--color-warm-400)]">
                {r.location}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {tab === "hearts" && (
                <Heart
                  className="w-4 h-4 text-pink-500"
                  fill="currentColor"
                />
              )}
              <span
                className={`text-lg font-bold ${
                  tab === "hearts"
                    ? "text-pink-500"
                    : "text-[var(--color-primary)]"
                }`}
              >
                {r.count}
              </span>
              {currentTab.unit && (
                <span className="text-[10px] text-[var(--color-warm-400)]">
                  {currentTab.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </AuthGuard>
  );
}
