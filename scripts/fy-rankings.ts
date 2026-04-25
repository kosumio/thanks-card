// FY rankings — covers 2025-04 through 2026-03 (and 2025-04 through 2026-02 for compare).
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function ranking(label: string, start: string, end: string) {
  const { data: cards } = await s
    .from("thanks_cards")
    .select("from_id, to_id")
    .gte("created_at", start)
    .lt("created_at", end);
  const { data: emps } = await s.from("employees").select("id, name, location");
  const id = new Map(emps!.map((e) => [e.id, `${e.name} (${e.location})`]));
  const recv: Record<string, number> = {};
  const sent: Record<string, number> = {};
  for (const c of cards || []) {
    recv[c.to_id] = (recv[c.to_id] || 0) + 1;
    sent[c.from_id] = (sent[c.from_id] || 0) + 1;
  }
  console.log(`\n========== ${label} (期間: ${start.slice(0,10)} 〜 ${end.slice(0,10)}) ==========`);
  console.log(`総カード数: ${cards?.length}\n`);
  console.log("--- もらった TOP 20 ---");
  for (const [k, v] of Object.entries(recv).sort((a,b)=>b[1]-a[1]).slice(0,20)) {
    console.log(`  ${String(v).padStart(3)}\t${id.get(k)}`);
  }
  console.log("\n--- 贈った TOP 20 ---");
  for (const [k, v] of Object.entries(sent).sort((a,b)=>b[1]-a[1]).slice(0,20)) {
    console.log(`  ${String(v).padStart(3)}\t${id.get(k)}`);
  }
}

(async () => {
  // FY2025 集計対象（新年度会 = 2025-04 〜 2026-02、3月分は間に合わず未反映）
  await ranking(
    "新年度会集計（2025-04 〜 2026-02、11ヶ月分）",
    "2025-04-01T00:00:00+09:00",
    "2026-03-01T00:00:00+09:00"
  );
  // FY2025 完全（2025-04 〜 2026-03、12ヶ月）
  await ranking(
    "FY2025 通期（2025-04 〜 2026-03、12ヶ月）",
    "2025-04-01T00:00:00+09:00",
    "2026-04-01T00:00:00+09:00"
  );
})();
