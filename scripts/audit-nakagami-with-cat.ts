/**
 * 旧ロジック忠実再現版：カテゴリ × 月 のループでバッジ獲得を再集計する。
 * （card_categories テーブルがまだ残っている前提）
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Target {
  id: string;
  name: string;
  location: string;
}

(async () => {
  const { data: emps } = await s.from("employees").select("id, name, location");
  const found = (emps ?? []).find((e) => e.name === "中上征三");
  if (!found) {
    console.error("中上征三 not found");
    return;
  }
  const target: Target = found;
  console.log(`target: ${target.name} (${target.location})`);

  const { data: cats } = await s.from("categories").select("id, value, icon");
  const catMap = new Map((cats ?? []).map((c) => [c.id, c]));
  console.log(`categories: ${cats?.length ?? 0}`);

  const { data: cards } = await s
    .from("thanks_cards")
    .select("id, from_id, to_id, created_at, card_reactions(user_id), card_categories(category_id)");

  interface Card {
    id: string;
    from_id: string;
    to_id: string;
    created_at: string;
    reaction_count: number;
    category_ids: string[];
  }
  const list: Card[] = (cards ?? []).map((c) => ({
    id: c.id,
    from_id: c.from_id,
    to_id: c.to_id,
    created_at: c.created_at,
    reaction_count: (c.card_reactions as { user_id: string }[] | null)?.length ?? 0,
    category_ids: (c.card_categories as { category_id: string }[] | null)?.map((cc) => cc.category_id) ?? [],
  }));

  console.log(`total cards: ${list.length}`);

  // 旧ロジック: 月別 × (全体 + カテゴリ別) で hearts/received/sent ランキングを作り、上位3名にバッジ
  const monthMap = new Map<string, Card[]>();
  for (const c of list) {
    const k = c.created_at.slice(0, 7);
    if (!monthMap.has(k)) monthMap.set(k, []);
    monthMap.get(k)!.push(c);
  }

  function oldRank(scores: Record<string, number>, myId: string): number | null {
    const myScore = scores[myId] || 0;
    if (myScore <= 0) return null;
    const sorted = Object.entries(scores)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
    const idx = sorted.findIndex(([id]) => id === myId);
    if (idx < 0 || idx >= 3) return null;
    return idx + 1;
  }

  function newRank(scores: Record<string, number>, myId: string): number | null {
    const myScore = scores[myId] || 0;
    if (myScore < 3) return null;
    const uniqueDesc = Array.from(
      new Set(
        Object.values(scores)
          .filter((v) => v >= 3)
          .sort((a, b) => b - a)
      )
    );
    const idx = uniqueDesc.indexOf(myScore);
    if (idx < 0 || idx > 2) return null;
    return idx + 1;
  }

  type Detail = {
    monthKey: string;
    scope: string; // "全体" or category value
    kind: "hearts" | "received" | "sent";
    myScore: number;
    oldRank: number | null;
    newRank: number | null;
  };
  const details: Detail[] = [];

  for (const [monthKey, monthCards] of monthMap) {
    function aggregate(cards: Card[]) {
      const hearts: Record<string, number> = {};
      const recv: Record<string, number> = {};
      const sent: Record<string, number> = {};
      for (const c of cards) {
        hearts[c.to_id] = (hearts[c.to_id] || 0) + c.reaction_count;
        recv[c.to_id] = (recv[c.to_id] || 0) + 1;
        sent[c.from_id] = (sent[c.from_id] || 0) + 1;
      }
      return { hearts, recv, sent };
    }

    function check(scope: string, cards: Card[]) {
      const a = aggregate(cards);
      const kinds: { kind: Detail["kind"]; scores: Record<string, number> }[] = [
        { kind: "hearts", scores: a.hearts },
        { kind: "received", scores: a.recv },
        { kind: "sent", scores: a.sent },
      ];
      for (const k of kinds) {
        const myScore = k.scores[target.id] || 0;
        const oR = oldRank(k.scores, target.id);
        const nR = newRank(k.scores, target.id);
        if (oR === null && nR === null && myScore === 0) continue;
        details.push({
          monthKey,
          scope,
          kind: k.kind,
          myScore,
          oldRank: oR,
          newRank: nR,
        });
      }
    }

    // 全体
    check("全体", monthCards);
    // カテゴリ別
    for (const [catId, cat] of catMap) {
      const filtered = monthCards.filter((c) => c.category_ids.includes(catId));
      if (filtered.length === 0) continue;
      check(`${cat.icon} ${cat.value}`, filtered);
    }
  }

  const oldBadges = details.filter((d) => d.oldRank !== null);
  const newBadges = details.filter((d) => d.newRank !== null);

  console.log(`old badges: ${oldBadges.length}, new badges: ${newBadges.length}`);

  const lines: string[] = [];
  lines.push("# 中上さん バッジ獲得監査 — カテゴリ込み（旧ロジック忠実再現）");
  lines.push("");
  lines.push(`抽出日: 2026-04-27`);
  lines.push(`対象: ${target.name}（${target.location}）`);
  lines.push(`総カード数: ${list.length} / カテゴリ数: ${cats?.length ?? 0}`);
  lines.push("");
  lines.push("## 旧ロジック（修正前）");
  lines.push("- 月 × (全体 + 各カテゴリ) で hearts/received/sent 3指標");
  lines.push("- 単純sortで先頭から3位以内");
  lines.push("- 最低件数フィルタなし（1枚で対象）");
  lines.push("");
  lines.push("## 新ロジック（修正後）");
  lines.push("- カテゴリ廃止 → 月 × (全体のみ) で 3指標");
  lines.push("- 最低3件以上");
  lines.push("- 同点全員ランクイン（ユニーク値ベース、上位3枠）");
  lines.push("");
  lines.push(`## 結果サマリ`);
  lines.push("");
  lines.push(`| ロジック | バッジ数 |`);
  lines.push(`|---------|---------|`);
  lines.push(`| 旧（カテゴリ込み） | ${oldBadges.length} 個 |`);
  lines.push(`| 新（カテゴリなし＋閾値3） | ${newBadges.length} 個 |`);
  lines.push("");
  lines.push("## 旧ロジック獲得バッジ詳細");
  lines.push("");
  lines.push("| 月 | 集計範囲 | 指標 | 自分の値 | 順位 |");
  lines.push("|----|---------|------|---------|------|");
  for (const d of oldBadges.sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1))) {
    lines.push(`| ${d.monthKey} | ${d.scope} | ${d.kind} | ${d.myScore} | ${d.oldRank}位 |`);
  }
  lines.push("");
  lines.push("## 新ロジック獲得バッジ詳細");
  lines.push("");
  if (newBadges.length === 0) {
    lines.push("（該当なし）");
  } else {
    lines.push("| 月 | 集計範囲 | 指標 | 自分の値 | 順位 |");
    lines.push("|----|---------|------|---------|------|");
    for (const d of newBadges.sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1))) {
      lines.push(`| ${d.monthKey} | ${d.scope} | ${d.kind} | ${d.myScore} | ${d.newRank}位 |`);
    }
  }

  const out = path.resolve("../../../clients/AWB/2026-04-27_nakagami-badge-audit.md");
  fs.writeFileSync(out, lines.join("\n"));
  console.log(`written: ${out}`);
})();
