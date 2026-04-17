"use client";

import { useState, useMemo, useEffect } from "react";
import { Inbox, Send, Trophy, Heart } from "lucide-react";
import AuthGuard from "@/components/auth-guard";
import CardItem from "@/components/card-item";
import { useAuth } from "@/lib/auth-context";
import { markAsReadAction } from "@/lib/actions";
import type { ThanksCard, CategoryInfo } from "@/lib/types";

type Tab = "received" | "sent";

interface MyPageClientProps {
  received: ThanksCard[];
  sent: ThanksCard[];
  readCardIds: string[];
  categories: CategoryInfo[];
}

export default function MyPageClient({
  received,
  sent,
  readCardIds,
  categories,
}: MyPageClientProps) {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>("received");
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(
    new Set(readCardIds)
  );

  const isUnread = (cardId: string) => !localReadIds.has(cardId);

  // Mark as read 2 seconds after viewing received tab
  useEffect(() => {
    if (tab !== "received" || received.length === 0) return;
    const unreadIds = received
      .filter((c) => isUnread(c.id))
      .map((c) => c.id);
    if (unreadIds.length === 0) return;
    const timer = setTimeout(async () => {
      await markAsReadAction(unreadIds);
      setLocalReadIds((prev) => {
        const next = new Set(prev);
        unreadIds.forEach((id) => next.add(id));
        return next;
      });
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, received]);

  const cards = tab === "received" ? received : sent;

  // Monthly badges
  interface Badge {
    label: string;
    rank: number;
    type: "hearts" | "received" | "sent";
    category?: string;
  }

  const allCards = useMemo(
    () => [...received, ...sent],
    [received, sent]
  );

  const badges = useMemo((): Badge[] => {
    if (!currentUser) return [];
    const result: Badge[] = [];

    const monthMap = new Map<string, ThanksCard[]>();
    allCards.forEach((c) => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthMap.has(key)) monthMap.set(key, []);
      monthMap.get(key)!.push(c);
    });

    function checkRanking(
      cards: ThanksCard[],
      monthLabel: string,
      categoryLabel?: string
    ) {
      const prefix = categoryLabel
        ? `${monthLabel} ${categoryLabel}`
        : monthLabel;

      // Hearts
      const heartsByPerson: Record<string, number> = {};
      cards.forEach((c) => {
        heartsByPerson[c.to.id] =
          (heartsByPerson[c.to.id] || 0) + c.reactionCount;
      });
      const heartRanking = Object.entries(heartsByPerson)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);
      const heartRank = heartRanking.findIndex(
        ([id]) => id === currentUser!.id
      );
      if (heartRank >= 0 && heartRank < 3) {
        result.push({
          label: `${prefix} 注目度`,
          rank: heartRank + 1,
          type: "hearts",
          category: categoryLabel,
        });
      }

      // Received
      const recvByPerson: Record<string, number> = {};
      cards.forEach((c) => {
        recvByPerson[c.to.id] = (recvByPerson[c.to.id] || 0) + 1;
      });
      const recvRanking = Object.entries(recvByPerson).sort(
        (a, b) => b[1] - a[1]
      );
      const recvRank = recvRanking.findIndex(
        ([id]) => id === currentUser!.id
      );
      if (recvRank >= 0 && recvRank < 3) {
        result.push({
          label: `${prefix} もらった数`,
          rank: recvRank + 1,
          type: "received",
          category: categoryLabel,
        });
      }

      // Sent
      const sentByPerson: Record<string, number> = {};
      cards.forEach((c) => {
        sentByPerson[c.from.id] = (sentByPerson[c.from.id] || 0) + 1;
      });
      const sentRanking = Object.entries(sentByPerson).sort(
        (a, b) => b[1] - a[1]
      );
      const sentRank = sentRanking.findIndex(
        ([id]) => id === currentUser!.id
      );
      if (sentRank >= 0 && sentRank < 3) {
        result.push({
          label: `${prefix} 贈った数`,
          rank: sentRank + 1,
          type: "sent",
          category: categoryLabel,
        });
      }
    }

    monthMap.forEach((monthCards, key) => {
      const [, month] = key.split("-").map(Number);
      const monthLabel = `${month}月`;

      checkRanking(monthCards, monthLabel);

      categories.forEach((cat) => {
        const catCards = monthCards.filter((c) =>
          c.categories.some((cc) => cc.value === cat.value)
        );
        if (catCards.length > 0) {
          checkRanking(catCards, monthLabel, `${cat.icon}${cat.value}`);
        }
      });
    });

    return result.sort((a, b) => {
      if (!a.category && b.category) return -1;
      if (a.category && !b.category) return 1;
      return a.rank - b.rank;
    });
  }, [currentUser, allCards, categories]);

  const badgeColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-amber-500 text-white";
    if (rank === 2) return "from-gray-300 to-gray-400 text-white";
    return "from-amber-500 to-amber-700 text-white";
  };

  const badgeIcon = (type: Badge["type"]) => {
    if (type === "hearts")
      return <Heart className="w-3 h-3" fill="currentColor" />;
    if (type === "received") return <Inbox className="w-3 h-3" />;
    return <Send className="w-3 h-3" />;
  };

  const unreadCount = received.filter((c) => isUnread(c.id)).length;

  return (
    <AuthGuard>
      <h2 className="text-lg font-bold text-[var(--color-warm-800)] mb-4">
        マイページ
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-[var(--color-warm-100)] text-center">
          <p className="text-2xl font-bold text-[var(--color-primary)]">
            {received.length}
          </p>
          <p className="text-xs text-[var(--color-warm-500)] mt-0.5">
            もらったカード
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[var(--color-warm-100)] text-center">
          <p className="text-2xl font-bold text-[var(--color-warm-700)]">
            {sent.length}
          </p>
          <p className="text-xs text-[var(--color-warm-500)] mt-0.5">
            贈ったカード
          </p>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-medium text-[var(--color-warm-500)] mb-2 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            あなたの獲得バッジ
          </h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((b, i) => (
              <div
                key={i}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${badgeColor(b.rank)} text-xs font-semibold shadow-sm`}
              >
                {badgeIcon(b.type)}
                <span>{b.label}</span>
                <span className="opacity-80">第{b.rank}位</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab */}
      <div className="flex bg-[var(--color-warm-100)] rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab("received")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "received"
              ? "bg-white text-[var(--color-primary)] shadow-sm"
              : "text-[var(--color-warm-500)]"
          }`}
        >
          <Inbox className="w-4 h-4" />
          もらった
          {unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-[var(--color-primary)] text-white text-[9px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("sent")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "sent"
              ? "bg-white text-[var(--color-primary)] shadow-sm"
              : "text-[var(--color-warm-500)]"
          }`}
        >
          <Send className="w-4 h-4" />
          贈った
        </button>
      </div>

      {/* Cards */}
      {cards.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-warm-400)]">
          <p className="text-sm">
            {tab === "received"
              ? "まだカードが届いていません"
              : "まだカードを贈っていません"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card, i) => (
            <div key={card.id} className="relative">
              {tab === "received" && isUnread(card.id) && (
                <span className="absolute -top-1 -left-1 z-10 px-1.5 py-0.5 rounded-md bg-[var(--color-primary)] text-white text-[9px] font-bold shadow-sm animate-card-in">
                  NEW
                </span>
              )}
              <CardItem
                card={card}
                showFrom={tab === "received"}
                showTo={tab === "sent"}
                index={i}
              />
            </div>
          ))}
        </div>
      )}
    </AuthGuard>
  );
}
