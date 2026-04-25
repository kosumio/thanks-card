// Mark the 12 good-thanks cards from 井島直子_サンクスカード調査.md as is_picked = true.
// Cards are matched by (created_at month, from name, to name, message substring).
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Pick {
  month: string; // YYYY-MM
  from: string;
  to: string;
  msgKey: string; // unique substring of the message
  voters: string[];
  reason?: string;
}

const PICKS: Pick[] = [
  { month: "2026-02", from: "井島直子", to: "境田美行",
    msgKey: "運搬いつもありがとうございます",
    voters: ["緑川"], reason: "他部署通しでも協力体制がとれていて素晴らしい" },
  { month: "2025-05", from: "井島直子", to: "緑川好美",
    msgKey: "保健所対応に尽力してくださり",
    voters: ["松嶋"], reason: "業務上での、2人の信頼関係が伝わってくるいい内容" },
  { month: "2025-05", from: "井島直子", to: "境田美行",
    msgKey: "急な搬入依頼にも対応してくださりありがうございます",
    voters: ["本多真基"] },
  { month: "2025-12", from: "梅田悠佳", to: "井島直子",
    msgKey: "お休みのところ事故の対応のためすぐ来て下さり",
    voters: ["緑川", "和田", "平野", "坂上"],
    reason: "緊急時しっかり報連相できる体制と関係性が素晴らしいです" },
  { month: "2025-12", from: "井島直子", to: "香川知世",
    msgKey: "体調悪い中、来るまで頑張ってくれてホント助かりました",
    voters: ["和田"], reason: "責任感の強さ素晴らしい" },
  { month: "2025-12", from: "井島直子", to: "石井幹子",
    msgKey: "シフトの変更にいつも柔軟に対応してくださり",
    voters: ["平野"], reason: "柔軟に対応してもらえるのは助かる" },
  { month: "2025-11", from: "井島直子", to: "香川知世",
    msgKey: "忙しい中、通販ソフト作ってくれてホント助かりました",
    voters: ["猪俣"], reason: "忙しい中の先読みで本当の忙しいとき備えができてすばらしい" },
  { month: "2025-11", from: "井島直子", to: "境田美行",
    msgKey: "今月もたくさんのケーキを運んでくださり",
    voters: ["松嶋"], reason: "荷物と一緒に笑顔も運んでいます" },
  { month: "2025-11", from: "井島直子", to: "緑川好美",
    msgKey: "ミナカでのレジトラブルの対応",
    voters: ["和田"], reason: "休日にも関わらずの対応に1票" },
  { month: "2025-10", from: "阿部綺花", to: "井島直子",
    msgKey: "箱根の研修時に送り迎えまで大変お世話になりました",
    voters: ["緑川"], reason: "新たな仲間の受け入れ態勢整え、そこに感謝できる、双方素晴らしい" },
  { month: "2025-09", from: "緑川好美", to: "井島直子",
    msgKey: "ミナカ店舗の様々なトラブル",
    voters: ["小田"] },
  { month: "2026-01", from: "井島直子", to: "加藤　学",
    msgKey: "お忙しい中、PCの対応とても助かりました",
    voters: ["小田"], reason: "他部署でも対応等とても素晴らしい" },
];

// Helper: normalize for name lookup (folds full-width / regular spaces)
const stripSpaces = (s: string) => s.replace(/[\s　]/g, "");

(async () => {
  // Build name -> id map
  const { data: emps } = await s.from("employees").select("id, name");
  const nameToId = new Map<string, string>();
  for (const e of emps || []) {
    nameToId.set(e.name, e.id);
    nameToId.set(stripSpaces(e.name), e.id);
  }

  console.log(`--- marking ${PICKS.length} grand-thanks cards ---`);
  let ok = 0;
  let fail = 0;
  for (const p of PICKS) {
    const fromId = nameToId.get(p.from);
    const toId = nameToId.get(p.to);
    if (!fromId || !toId) {
      console.error(`  [name miss] ${p.from} -> ${p.to}`);
      fail++;
      continue;
    }
    const start = `${p.month}-01T00:00:00+09:00`;
    const [y, mo] = p.month.split("-").map(Number);
    const ny = mo === 12 ? y + 1 : y;
    const nm = mo === 12 ? 1 : mo + 1;
    const end = `${ny}-${String(nm).padStart(2, "0")}-01T00:00:00+09:00`;
    const { data: cards } = await s
      .from("thanks_cards")
      .select("id, message")
      .eq("from_id", fromId)
      .eq("to_id", toId)
      .gte("created_at", start)
      .lt("created_at", end);
    const matches = (cards || []).filter((c) => c.message.includes(p.msgKey));
    if (matches.length === 0) {
      console.error(`  [no card] ${p.month} ${p.from} -> ${p.to} key="${p.msgKey.slice(0, 20)}…"`);
      fail++;
      continue;
    }
    if (matches.length > 1) {
      console.warn(`  [multi] ${p.month} ${p.from} -> ${p.to} matched ${matches.length} cards, marking all`);
    }
    for (const m of matches) {
      const { error } = await s.from("thanks_cards").update({ is_picked: true }).eq("id", m.id);
      if (error) {
        console.error(`  [update err] ${m.id}: ${error.message}`);
        fail++;
      } else {
        console.log(`  ✓ ${p.month} ${p.from}→${p.to} (${matches.length === 1 ? "" : "+ multi"}) [voters: ${p.voters.join(",")}]`);
        ok++;
      }
    }
  }
  console.log(`--- done: ${ok} marked, ${fail} failed ---`);

  const { count } = await s
    .from("thanks_cards")
    .select("*", { count: "exact", head: true })
    .eq("is_picked", true);
  console.log(`is_picked total now: ${count}`);
})();
