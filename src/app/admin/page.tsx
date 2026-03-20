"use client";

import { useState, useMemo } from "react";
import { Award, Users, TrendingUp, FileBarChart, Heart, Search } from "lucide-react";
import AuthGuard from "@/components/auth-guard";
import CardItem from "@/components/card-item";
import {
  thanksCards,
  employees,
  LOCATIONS,
  CATEGORIES,
  getEmployee,
} from "@/lib/mock-data";

export default function AdminPage() {
  const [cards, setCards] = useState(thanksCards);
  const [showAllCards, setShowAllCards] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalCards = cards.length;
    const totalEmployees = employees.length;
    const activeWriters = new Set(cards.map((c) => c.fromId)).size;
    const totalHearts = cards.reduce((sum, c) => sum + c.reactions, 0);

    const categoryBreakdown = CATEGORIES.map((cat) => ({
      ...cat,
      count: cards.filter((c) => c.categories.includes(cat.value)).length,
    }));

    const locationBreakdown = LOCATIONS.map((loc) => {
      const locEmployees = employees.filter((e) => e.location === loc);
      const locSent = cards.filter((c) => {
        const from = getEmployee(c.fromId);
        return from?.location === loc;
      }).length;
      const locReceived = cards.filter((c) => {
        const to = getEmployee(c.toId);
        return to?.location === loc;
      }).length;
      return {
        location: loc,
        employees: locEmployees.length,
        sent: locSent,
        received: locReceived,
        rate:
          locEmployees.length > 0
            ? Math.round((locSent / locEmployees.length) * 100)
            : 0,
      };
    });

    const crossLocationCards = cards.filter((c) => {
      const from = getEmployee(c.fromId);
      const to = getEmployee(c.toId);
      return from && to && from.location !== to.location;
    }).length;

    const pickedCards = cards.filter((c) => c.isPicked);

    const involvedIds = new Set([
      ...cards.map((c) => c.fromId),
      ...cards.map((c) => c.toId),
    ]);
    const isolatedEmployees = employees.filter((e) => !involvedIds.has(e.id));

    return {
      totalCards,
      totalEmployees,
      activeWriters,
      totalHearts,
      categoryBreakdown,
      locationBreakdown,
      crossLocationCards,
      pickedCards,
      isolatedEmployees,
    };
  }, [cards]);

  const handleTogglePicked = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, isPicked: !c.isPicked } : c
      )
    );
  };

  return (
    <AuthGuard>
      <h2 className="text-lg font-bold text-[var(--color-warm-800)] mb-5">
        管理ダッシュボード
      </h2>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          {
            label: "総カード数",
            value: stats.totalCards,
            icon: FileBarChart,
            color: "text-[var(--color-primary)]",
          },
          {
            label: "贈った人数",
            value: `${stats.activeWriters}/${stats.totalEmployees}`,
            icon: Users,
            color: "text-blue-600",
          },
          {
            label: "拠点間カード",
            value: stats.crossLocationCards,
            icon: TrendingUp,
            color: "text-green-600",
          },
          {
            label: "総ハート数",
            value: stats.totalHearts,
            icon: Heart,
            color: "text-pink-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-4 border border-[var(--color-warm-100)]"
          >
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-[10px] text-[var(--color-warm-500)]">
                {s.label}
              </span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Location breakdown */}
      <div className="bg-white rounded-2xl p-4 border border-[var(--color-warm-100)] mb-5">
        <h3 className="text-sm font-semibold text-[var(--color-warm-800)] mb-3">
          拠点別 投稿率
        </h3>
        <div className="space-y-3">
          {stats.locationBreakdown.map((loc) => (
            <div key={loc.location}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--color-warm-700)]">
                  {loc.location}（{loc.employees}名）
                </span>
                <span className="font-semibold text-[var(--color-primary)]">
                  {loc.rate}%
                </span>
              </div>
              <div className="h-2 bg-[var(--color-warm-100)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full transition-all"
                  style={{ width: `${Math.min(loc.rate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--color-warm-400)] mt-0.5">
                <span>送信 {loc.sent} 枚</span>
                <span>受信 {loc.received} 枚</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-2xl p-4 border border-[var(--color-warm-100)] mb-5">
        <h3 className="text-sm font-semibold text-[var(--color-warm-800)] mb-3">
          カテゴリ別 分布
        </h3>
        <div className="space-y-2">
          {stats.categoryBreakdown.map((cat) => (
            <div key={cat.value} className="flex items-center gap-3">
              <span
                className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}
              >
                {cat.icon} {cat.value}
              </span>
              <div className="flex-1 h-2 bg-[var(--color-warm-100)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cat.bg}`}
                  style={{
                    width: `${
                      stats.totalCards > 0
                        ? (cat.count / stats.totalCards) * 100
                        : 0
                    }%`,
                    minWidth: cat.count > 0 ? "8px" : "0",
                  }}
                />
              </div>
              <span className="text-xs font-medium text-[var(--color-warm-600)] w-8 text-right">
                {cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Isolated employees warning */}
      {stats.isolatedEmployees.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-5">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            カード未参加の社員
          </h3>
          <p className="text-xs text-amber-700 mb-2">
            送受信ともに0枚の社員です。フォローを検討してください。
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.isolatedEmployees.map((e) => (
              <span
                key={e.id}
                className="text-xs px-2.5 py-1 bg-white rounded-lg border border-amber-200 text-amber-800"
              >
                {e.name}（{e.location}）
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Picked cards (好事例) */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[var(--color-warm-800)] mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          好事例（{stats.pickedCards.length}件）
        </h3>
        {stats.pickedCards.length > 0 ? (
          <div className="space-y-3">
            {stats.pickedCards.map((card, i) => (
              <div key={card.id} className="relative">
                <CardItem card={card} index={i} />
                <button
                  onClick={() => handleTogglePicked(card.id)}
                  className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors font-medium"
                >
                  好事例を解除
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-warm-400)] py-4 text-center">
            好事例に選定されたカードはまだありません
          </p>
        )}
      </div>

      {/* カード検索（好事例選定用） */}
      <div className="mb-5">
        <button
          onClick={() => setShowAllCards((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium text-[var(--color-primary)] bg-[var(--color-warm-50)] border border-[var(--color-warm-200)] hover:bg-[var(--color-warm-100)] transition-colors"
        >
          <Search className="w-4 h-4" />
          {showAllCards ? "カード検索を閉じる" : "カードを検索して好事例を選定する"}
        </button>

        {showAllCards && (
          <div className="mt-3">
            {/* 検索フィルター */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-warm-400)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="送信者・受信者の名前で検索"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--color-warm-200)] bg-white text-sm text-[var(--color-warm-800)] placeholder:text-[var(--color-warm-300)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSearchCategory(null)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                    searchCategory === null
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-warm-50)] text-[var(--color-warm-500)] border border-[var(--color-warm-200)]"
                  }`}
                >
                  全カテゴリ
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSearchCategory(searchCategory === cat.value ? null : cat.value)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                      searchCategory === cat.value
                        ? `${cat.bg} ${cat.color} ring-1 ring-current`
                        : "bg-[var(--color-warm-50)] text-[var(--color-warm-500)] border border-[var(--color-warm-200)]"
                    }`}
                  >
                    {cat.icon} {cat.value}
                  </button>
                ))}
              </div>
            </div>

            {/* 検索結果 */}
            <div className="space-y-3">
              {(() => {
                const q = searchQuery.trim().toLowerCase();
                const filtered = cards
                  .filter((card) => {
                    if (searchCategory && !card.categories.includes(searchCategory as any)) return false;
                    if (!q) return true;
                    const from = getEmployee(card.fromId);
                    const to = getEmployee(card.toId);
                    return (
                      from?.name.includes(q) ||
                      from?.nameKana.includes(q) ||
                      to?.name.includes(q) ||
                      to?.nameKana.includes(q) ||
                      card.message.includes(q)
                    );
                  })
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  );

                if (filtered.length === 0) {
                  return (
                    <p className="text-center py-8 text-sm text-[var(--color-warm-400)]">
                      該当するカードがありません
                    </p>
                  );
                }

                return (
                  <>
                    <p className="text-[10px] text-[var(--color-warm-400)]">
                      {filtered.length}件のカード
                    </p>
                    {filtered.map((card, i) => (
                      <div key={card.id} className="relative">
                        <CardItem card={card} index={i} />
                        <button
                          onClick={() => handleTogglePicked(card.id)}
                          className={`absolute top-2 right-2 text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${
                            card.isPicked
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-white/80 text-[var(--color-warm-500)] border border-[var(--color-warm-200)] hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                          }`}
                        >
                          {card.isPicked ? "好事例を解除" : "好事例に選定"}
                        </button>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
