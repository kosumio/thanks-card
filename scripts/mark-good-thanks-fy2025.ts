// Mark all 150 picks from FY2025 集計用 sheet as is_picked = true.
// Resets is_picked = false on everything else first to ensure clean state.
// Source: scripts/import-data/good-thanks-fy2025.json

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Pick {
  row: number;
  to_name: string;
  message: string;
  from_name: string;
  voters: string[];
  reason: string | null;
  vote_count: number;
}

const stripSpaces = (s: string) => s.replace(/[\s　]/g, "");

(async () => {
  const file = path.resolve(__dirname, "import-data/good-thanks-fy2025.json");
  const picks = JSON.parse(fs.readFileSync(file, "utf-8")) as Pick[];

  // 0. Reset is_picked = false on everything (idempotency)
  console.log("--- resetting is_picked on all cards ---");
  const { error: resetErr } = await s
    .from("thanks_cards")
    .update({ is_picked: false })
    .eq("is_picked", true);
  console.log("  reset:", resetErr?.message ?? "ok");

  // 1. Build name -> id (with space-stripped variant)
  const { data: emps } = await s.from("employees").select("id, name");
  const nameToId = new Map<string, string>();
  for (const e of emps || []) {
    nameToId.set(e.name, e.id);
    nameToId.set(stripSpaces(e.name), e.id);
  }
  // Manual aliases for known typos / informal names in the source xlsx
  const aliases: Record<string, string> = {
    "葛屋柚香": "葛谷柚香", // typo (本来は葛谷)
    "尾崎寛":   "尾崎",     // full name fallback
  };
  for (const [from, to] of Object.entries(aliases)) {
    const id = nameToId.get(to);
    if (id) nameToId.set(from, id);
  }

  // 2. Mark each pick
  console.log(`--- marking ${picks.length} picks ---`);
  let ok = 0, miss = 0;
  const missed: { row: number; reason: string; pick: Pick }[] = [];
  for (const p of picks) {
    const fromId = nameToId.get(p.from_name) ?? nameToId.get(stripSpaces(p.from_name));
    const toId = nameToId.get(p.to_name) ?? nameToId.get(stripSpaces(p.to_name));
    if (!fromId || !toId) {
      missed.push({ row: p.row, reason: `name miss from=${!!fromId} to=${!!toId}`, pick: p });
      miss++;
      continue;
    }
    // Find card by from + to + exact message
    const { data: cards } = await s
      .from("thanks_cards")
      .select("id, message, created_at")
      .eq("from_id", fromId)
      .eq("to_id", toId);
    const exact = (cards || []).filter((c) => c.message.replace(/\s/g, "") === p.message.replace(/\s/g, ""));
    if (exact.length === 0) {
      // Try substring matching
      const partial = (cards || []).filter((c) => c.message.includes(p.message.slice(0, 20)));
      if (partial.length === 0) {
        missed.push({ row: p.row, reason: "no card match", pick: p });
        miss++;
        continue;
      }
      for (const c of partial) {
        await s.from("thanks_cards").update({ is_picked: true }).eq("id", c.id);
        ok++;
      }
      continue;
    }
    for (const c of exact) {
      await s.from("thanks_cards").update({ is_picked: true }).eq("id", c.id);
      ok++;
    }
  }
  console.log(`--- done: ${ok} marked, ${miss} missed ---`);
  if (missed.length) {
    console.log("\n=== missed ===");
    for (const m of missed.slice(0, 30)) {
      console.log(`  row${m.row} [${m.reason}] ${m.pick.from_name}→${m.pick.to_name}: ${m.pick.message.slice(0, 30)}`);
    }
    fs.writeFileSync(
      path.resolve(__dirname, "import-data/good-thanks-missed.json"),
      JSON.stringify(missed, null, 2),
      "utf-8"
    );
  }
  const { count } = await s
    .from("thanks_cards")
    .select("*", { count: "exact", head: true })
    .eq("is_picked", true);
  console.log(`is_picked total now: ${count}`);
})();
