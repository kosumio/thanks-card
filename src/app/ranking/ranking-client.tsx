"use client";

import { useState, useMemo } from "react";
import { Heart, Inbox, Send, Trophy, Award } from "lucide-react";
import AuthGuard from "@/components/auth-guard";
import type { ThanksCard, Employee } from "@/lib/types";

type RankingType = "received" | "sent" | "hearts" | "picked";

interface PersonRank {
  id: string;
  name: string;
  location: string;
  count: number;
}

interface RankingClientProps {
  cards: ThanksCard[];
  employees: Employee[];
  currentUserId: string;
}

// --- Period filter ---
type PeriodKey = string; // e.g. "all" / "fy2025" / "2026-03"

interface PeriodOption {
  key: PeriodKey;
  label: string;
  /** Inclusive UTC bounds (ms). null = unbounded */
  start: number | null;
  end: number | null;
}

function buildPeriods(cards: ThanksCard[]): PeriodOption[] {
  const monthSet = new Set<string>();
  for (const c of cards) {
    monthSet.add(c.createdAt.slice(0, 7)); // YYYY-MM
  }
  const months = Array.from(monthSet).sort().reverse();
  const opts: PeriodOption[] = [
    { key: "all", label: "全期間", start: null, end: null },
    {
      key: "fy2025",
      label: "FY2025（2025年4月〜2026年3月）",
      start: Date.parse("2025-04-01T00:00:00+09:00"),
      end: Date.parse("2026-04-01T00:00:00+09:00"),
    },
  ];
  for (const m of months) {
    const [y, mo] = m.split("-").map(Number);
    const ny = mo === 12 ? y + 1 : y;
    const nm = mo === 12 ? 1 : mo + 1;
    opts.push({
      key: m,
      label: `${y}年${mo}月`,
      start: Date.parse(`${m}-01T00:00:00+09:00`),
      end: Date.parse(`${ny}-${String(nm).padStart(2, "0")}-01T00:00:00+09:00`),
    });
  }
  return opts;
}

export default function RankingClient({
  cards,
  employees,
  currentUserId,
}: RankingClientProps) {
  const [tab, setTab] = useState<RankingType>("received");
  const [periodKey, setPeriodKey] = useState<PeriodKey>("fy2025");

  const periods = useMemo(() => buildPeriods(cards), [cards]);
  const currentPeriod = periods.find((p) => p.key === periodKey) ?? periods[0];

  function buildFullRanking(type: RankingType): PersonRank[] {
    const counts: Record<string, number> = {};
    let filtered = cards;
    if (currentPeriod.start !== null) {
      const s = currentPeriod.start;
      filtered = filtered.filter((c) => Date.parse(c.createdAt) >= s);
    }
    if (currentPeriod.end !== null) {
      const e = currentPeriod.end;
      filtered = filtered.filter((c) => Date.parse(c.createdAt) < e);
    }

    filtered.forEach((c) => {
      if (type === "received") {
        counts[c.to.id] = (counts[c.to.id] || 0) + 1;
      } else if (type === "sent") {
        counts[c.from.id] = (counts[c.from.id] || 0) + 1;
      } else if (type === "hearts") {
        counts[c.to.id] = (counts[c.to.id] || 0) + c.reactionCount;
      } else {
        // picked = 好事例（送信側・受信側それぞれに 1 加算）
        if (c.isPicked) {
          counts[c.to.id] = (counts[c.to.id] || 0) + 1;
          counts[c.from.id] = (counts[c.from.id] || 0) + 1;
        }
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
    () => buildFullRanking(tab),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, cards, employees, periodKey]
  );
  const currentRanking = fullRanking.slice(0, 20);

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
      label: "みんなで選ぶ\nグッドサンクス",
      icon: Heart,
      unit: "",
    },
    { key: "picked" as const, label: "好事例", icon: Award, unit: "件" },
  ];

  const currentTab = tabs.find((t) => t.key === tab)!;
  const rankingLabel = "総合";

  return (
    <AuthGuard>
      <h2 className="text-lg font-bold text-[var(--color-warm-800)] mb-3">
        ランキング
      </h2>

      {/* Period selector */}
      <div className="mb-3">
        <label className="block text-[10px] text-[var(--color-warm-500)] mb-1">
          集計期間
        </label>
        <select
          value={periodKey}
          onChange={(e) => setPeriodKey(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-warm-200)] bg-white text-sm text-[var(--color-warm-800)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
        >
          {periods.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab */}
      <div className="flex bg-[var(--color-warm-100)] rounded-xl p-1 mb-4 gap-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] leading-tight font-medium transition-all whitespace-pre-line text-center ${
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

      {/* My rank */}
      {!myRank && currentUserId && (
        <div className="mb-4 bg-[var(--color-warm-50)] rounded-2xl p-4 border border-[var(--color-warm-200)] text-center">
          <p className="text-xs text-[var(--color-warm-500)]">
            この期間ではまだランキング外です
          </p>
          <p className="text-[10px] text-[var(--color-warm-400)] mt-1">
            一通カードを送るとランキングに登場します
          </p>
        </div>
      )}
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
        {rankingLabel} TOP20
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
