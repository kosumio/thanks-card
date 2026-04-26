/**
 * 中上さんが現バッジロジック（修正前: カテゴリ別×月別、最低件数なし、同点1位扱い）で
 * 何個バッジを獲得しているか / 新ロジック（カテゴリなし、最低3件、同点全員ランクイン）で
 * いくつに減るかを比較する。
 *
 * 出力: clients/AWB/2026-04-27_nakagami-badge-audit.md
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

const NAKAGAMI_NAME_FRAGMENT = "中上";
const BADGE_MIN_THRESHOLD = 3;

interface CardLite {
  id: string;
  from_id: string;
  to_id: string;
  reaction_count: number;
  created_at: string;
}

(async () => {
  const { data: emps } = await s
    .from("employees")
    .select("id, name, location, is_active");
  const nakagamis =
    emps?.filter((e) => e.is_active && e.name.includes(NAKAGAMI_NAME_FRAGMENT)) ?? [];

  if (nakagamis.length === 0) {
    console.error("中上さんが見つかりません");
    return;
  }
  console.log(`中上候補: ${nakagamis.map((e) => `${e.name}(${e.location})`).join(", ")}`);

  // すべてのカードを取得（リアクション数も）
  const { data: cardsRaw } = await s
    .from("thanks_cards")
    .select("id, from_id, to_id, created_at, card_reactions(user_id)");
  const cards: CardLite[] = (cardsRaw ?? []).map((c) => ({
    id: c.id,
    from_id: c.from_id,
    to_id: c.to_id,
    created_at: c.created_at,
    reaction_count: (c.card_reactions as { user_id: string }[] | null)?.length ?? 0,
  }));

  console.log(`total cards: ${cards.length}`);

  // 月別に分割
  const monthMap = new Map<string, CardLite[]>();
  for (const c of cards) {
    const d = new Date(c.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(c);
  }

  type BadgeKind = "hearts" | "received" | "sent";

  // 旧ロジック相当（カテゴリは廃止済なのでカテゴリなしのみ）：閾値なし、単純sortで先頭3つを1位扱い
  function oldRank(scores: Record<string, number>, myId: string): number | null {
    const myScore = scores[myId] || 0;
    if (myScore <= 0) return null;
    const ranking = Object.entries(scores)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1000); // 旧ロジックは順位indexベース
    const idx = ranking.findIndex(([id]) => id === myId);
    if (idx < 0 || idx >= 3) return null;
    return idx + 1;
  }

  // 新ロジック：閾値3、ユニーク値ベース、同点全員ランクイン、上位3枠
  function newRank(scores: Record<string, number>, myId: string): number | null {
    const myScore = scores[myId] || 0;
    if (myScore < BADGE_MIN_THRESHOLD) return null;
    const uniqueDesc = Array.from(
      new Set(
        Object.values(scores)
          .filter((v) => v >= BADGE_MIN_THRESHOLD)
          .sort((a, b) => b - a)
      )
    );
    const idx = uniqueDesc.indexOf(myScore);
    if (idx < 0 || idx > 2) return null;
    return idx + 1;
  }

  const lines: string[] = [];
  lines.push("# 中上さん バッジ獲得監査（旧ロジック vs 新ロジック）");
  lines.push("");
  lines.push("抽出日: 2026-04-27");
  lines.push("");
  lines.push("## 候補");
  lines.push("");
  for (const n of nakagamis) {
    lines.push(`- ${n.name}（${n.location}） / id=${n.id}`);
  }
  lines.push("");
  lines.push("## ロジック差分");
  lines.push("");
  lines.push("| 項目 | 旧ロジック | 新ロジック |");
  lines.push("|------|----------|----------|");
  lines.push("| カテゴリ別ループ | あり（最大1月8倍） | なし（カテゴリ廃止） |");
  lines.push("| 最低件数フィルタ | なし（1枚で対象） | 3件以上 |");
  lines.push("| 同点処理 | 単純sort・上位3名のみ | ユニーク値ベース・同点全員ランクイン |");
  lines.push("");

  for (const target of nakagamis) {
    lines.push(`---`);
    lines.push("");
    lines.push(`## ${target.name}（${target.location}）`);
    lines.push("");

    let oldTotal = 0;
    let newTotal = 0;
    const monthLines: string[] = [];

    const sortedMonths = Array.from(monthMap.keys()).sort().reverse();
    for (const monthKey of sortedMonths) {
      const monthCards = monthMap.get(monthKey)!;

      const heartScores: Record<string, number> = {};
      const recvScores: Record<string, number> = {};
      const sentScores: Record<string, number> = {};
      monthCards.forEach((c) => {
        heartScores[c.to_id] = (heartScores[c.to_id] || 0) + c.reaction_count;
        recvScores[c.to_id] = (recvScores[c.to_id] || 0) + 1;
        sentScores[c.from_id] = (sentScores[c.from_id] || 0) + 1;
      });

      const myHearts = heartScores[target.id] || 0;
      const myRecv = recvScores[target.id] || 0;
      const mySent = sentScores[target.id] || 0;

      const records: string[] = [];
      const types: { kind: BadgeKind; scores: Record<string, number>; myScore: number }[] = [
        { kind: "hearts", scores: heartScores, myScore: myHearts },
        { kind: "received", scores: recvScores, myScore: myRecv },
        { kind: "sent", scores: sentScores, myScore: mySent },
      ];

      for (const t of types) {
        const oldR = oldRank(t.scores, target.id);
        const newR = newRank(t.scores, target.id);
        if (oldR === null && newR === null) continue;
        if (oldR !== null) oldTotal++;
        if (newR !== null) newTotal++;
        records.push(
          `  - ${t.kind}: 自分=${t.myScore}件, 旧=${oldR ? `${oldR}位` : "—"}, 新=${newR ? `${newR}位` : "—"}`
        );
      }

      if (records.length > 0) {
        monthLines.push(`### ${monthKey}`);
        monthLines.push("");
        monthLines.push(...records);
        monthLines.push("");
      }
    }

    lines.push(`**旧ロジックでのバッジ累計: ${oldTotal} 個**`);
    lines.push(`**新ロジックでのバッジ累計: ${newTotal} 個**`);
    lines.push("");
    lines.push("### 月別内訳");
    lines.push("");
    lines.push(...monthLines);
  }

  const out = path.resolve("../../../clients/AWB/2026-04-27_nakagami-badge-audit.md");
  fs.writeFileSync(out, lines.join("\n"));
  console.log(`written: ${out}`);
})();
