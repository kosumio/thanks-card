import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  // 1. Total cards
  const { count: total } = await s
    .from("thanks_cards")
    .select("*", { count: "exact", head: true });
  console.log("=== total cards ===", total);

  // 2. Duplicate detection: same from/to/message/created_at
  const { data: cards } = await s
    .from("thanks_cards")
    .select("id, from_id, to_id, message, created_at");
  const key = (c: { from_id: string; to_id: string; message: string; created_at: string }) =>
    `${c.from_id}|${c.to_id}|${c.message}|${c.created_at}`;
  const groups = new Map<string, string[]>();
  for (const c of cards || []) {
    const k = key(c);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(c.id);
  }
  const dupes = Array.from(groups.values()).filter((ids) => ids.length > 1);
  console.log(`=== duplicate groups: ${dupes.length} (extra rows: ${dupes.reduce((s, g) => s + g.length - 1, 0)}) ===`);
  for (const g of dupes.slice(0, 5)) console.log(`  group of ${g.length}: ${g[0]}`);

  // 3. Per-month counts
  console.log("=== cards per month ===");
  const months = ["2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03"];
  for (const m of months) {
    const start = `${m}-01T00:00:00+09:00`;
    const [y, mo] = m.split("-").map(Number);
    const ny = mo === 12 ? y + 1 : y;
    const nm = mo === 12 ? 1 : mo + 1;
    const end = `${ny}-${String(nm).padStart(2, "0")}-01T00:00:00+09:00`;
    const { count } = await s
      .from("thanks_cards")
      .select("*", { count: "exact", head: true })
      .gte("created_at", start)
      .lt("created_at", end);
    console.log(`  ${m}: ${count}`);
  }

  // 4. Top 10 received (all-time)
  const { data: emps } = await s.from("employees").select("id, name, location");
  const idToName = new Map(emps!.map((e) => [e.id, `${e.name} (${e.location})`]));
  const receivedCount: Record<string, number> = {};
  const sentCount: Record<string, number> = {};
  for (const c of cards || []) {
    receivedCount[c.to_id] = (receivedCount[c.to_id] || 0) + 1;
    sentCount[c.from_id] = (sentCount[c.from_id] || 0) + 1;
  }
  const sortedRecv = Object.entries(receivedCount).sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log("=== Top 15 もらった (全期間) ===");
  for (const [id, n] of sortedRecv) console.log(`  ${n}\t${idToName.get(id)}`);
  const sortedSent = Object.entries(sentCount).sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log("=== Top 15 贈った (全期間) ===");
  for (const [id, n] of sortedSent) console.log(`  ${n}\t${idToName.get(id)}`);

  // 5. Top 10 received, March only (the original 'last year' assumption mismatch?)
  const { data: marchCards } = await s
    .from("thanks_cards")
    .select("from_id, to_id")
    .gte("created_at", "2026-03-01T00:00:00+09:00")
    .lt("created_at", "2026-04-01T00:00:00+09:00");
  const marchRecv: Record<string, number> = {};
  for (const c of marchCards || []) marchRecv[c.to_id] = (marchRecv[c.to_id] || 0) + 1;
  const marchTop = Object.entries(marchRecv).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log("=== Top 10 もらった (2026-03 のみ) ===");
  for (const [id, n] of marchTop) console.log(`  ${n}\t${idToName.get(id)}`);
})();
