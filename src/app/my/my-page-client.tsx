"use client";

import { useState, useMemo, useEffect } from "react";
import { Inbox, Send, Trophy, Heart } from "lucide-react";
import AuthGuard from "@/components/auth-guard";
import CardItem from "@/components/card-item";
import { useAuth } from "@/lib/auth-context";
import { markAsReadAction, deleteCardAction } from "@/lib/actions";
import { useRouter } from "next/navigation";
import type { ThanksCard } from "@/lib/types";

type Tab = "received" | "sent";

// バッジ獲得の最低件数。これ未満のスコアはランキング対象外。
const BADGE_MIN_THRESHOLD = 3;

interface MyPageClientProps {
  received: ThanksCard[];
  sent: ThanksCard[];
  readCardIds: string[];
  /** 全社員の全カード（バッジ集計用） */
  allCards: ThanksCard[];
  totalEmployees: number;
}

interface Badge {
  monthLabel: string;
  rank: 1 | 2 | 3;
  type: "hearts" | "received" | "sent";
  myCount: number;
}

const TYPE_LABEL: Record<Badge["type"], string> = {
  hearts: "注目度",
  received: "もらった数",
  sent: "贈った数",
};

export default function MyPageClient({
  received,
  sent,
  readCardIds,
  allCards,
}: MyPageClientProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
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

  const badges = useMemo<Badge[]>(() => {
    if (!currentUser) return [];
    const result: Badge[] = [];

    const monthMap = new Map<string, ThanksCard[]>();
    allCards.forEach((c) => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthMap.has(key)) monthMap.set(key, []);
      monthMap.get(key)!.push(c);
    });

    function getRank(scores: Record<string, number>): 1 | 2 | 3 | null {
      const myScore = scores[currentUser!.id] || 0;
      if (myScore < BADGE_MIN_THRESHOLD) return null;
      // 上位ユニーク値（降順、重複除外）の中で自分の位置を求める
      const uniqueDesc = Array.from(
        new Set(
          Object.values(scores)
            .filter((v) => v >= BADGE_MIN_THRESHOLD)
            .sort((a, b) => b - a)
        )
      );
      const idx = uniqueDesc.indexOf(myScore);
      if (idx < 0 || idx > 2) return null;
      return (idx + 1) as 1 | 2 | 3;
    }

    monthMap.forEach((monthCards, key) => {
      const [year, month] = key.split("-").map(Number);
      const monthLabel = `${year}年${month}月`;

      const heartScores: Record<string, number> = {};
      const recvScores: Record<string, number> = {};
      const sentScores: Record<string, number> = {};
      monthCards.forEach((c) => {
        heartScores[c.to.id] = (heartScores[c.to.id] || 0) + c.reactionCount;
        recvScores[c.to.id] = (recvScores[c.to.id] || 0) + 1;
        sentScores[c.from.id] = (sentScores[c.from.id] || 0) + 1;
      });

      const hRank = getRank(heartScores);
      if (hRank) {
        result.push({
          monthLabel,
          rank: hRank,
          type: "hearts",
          myCount: heartScores[currentUser.id] || 0,
        });
      }
      const rRank = getRank(recvScores);
      if (rRank) {
        result.push({
          monthLabel,
          rank: rRank,
          type: "received",
          myCount: recvScores[currentUser.id] || 0,
        });
      }
      const sRank = getRank(sentScores);
      if (sRank) {
        result.push({
          monthLabel,
          rank: sRank,
          type: "sent",
          myCount: sentScores[currentUser.id] || 0,
        });
      }
    });

    // 新しい月から、同月内は順位昇順
    return result.sort((a, b) => {
      if (a.monthLabel !== b.monthLabel) {
        return a.monthLabel < b.monthLabel ? 1 : -1;
      }
      return a.rank - b.rank;
    });
  }, [currentUser, allCards]);

  const medalGradient = (rank: number) => {
    if (rank === 1) return "from-yellow-300 via-yellow-400 to-amber-500";
    if (rank === 2) return "from-gray-200 via-gray-300 to-gray-400";
    return "from-amber-400 via-amber-500 to-amber-700";
  };

  const medalRing = (rank: number) => {
    if (rank === 1) return "ring-yellow-200";
    if (rank === 2) return "ring-gray-200";
    return "ring-amber-200";
  };

  const typeIcon = (type: Badge["type"]) => {
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
          <p className="text-[9px] text-[var(--color-warm-400)] mt-0.5">
            2025年4月～累計
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[var(--color-warm-100)] text-center">
          <p className="text-2xl font-bold text-[var(--color-warm-700)]">
            {sent.length}
          </p>
          <p className="text-xs text-[var(--color-warm-500)] mt-0.5">
            贈ったカード
          </p>
          <p className="text-[9px] text-[var(--color-warm-400)] mt-0.5">
            2025年4月～累計
          </p>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-medium text-[var(--color-warm-500)] mb-3 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            あなたの獲得バッジ
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {badges.map((b, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center"
                title={`${b.monthLabel} ${TYPE_LABEL[b.type]} ${b.rank}位（${b.myCount}）`}
              >
                <div
                  className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${medalGradient(b.rank)} ring-2 ${medalRing(b.rank)} shadow-md flex items-center justify-center`}
                >
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[8px] font-bold text-[var(--color-warm-700)] flex items-center justify-center shadow-sm">
                    {b.rank}
                  </span>
                  <span className="text-white drop-shadow">
                    {typeIcon(b.type)}
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] font-semibold text-[var(--color-warm-700)] leading-tight">
                  {TYPE_LABEL[b.type]}
                </p>
                <p className="text-[9px] text-[var(--color-warm-400)] leading-tight">
                  {b.monthLabel}
                </p>
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
                onDelete={async (cardId) => {
                  const res = await deleteCardAction(cardId);
                  if (!res.error) router.refresh();
                  return res;
                }}
              />
            </div>
          ))}
        </div>
      )}
    </AuthGuard>
  );
}
