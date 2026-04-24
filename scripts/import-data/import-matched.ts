// Import fully-matched cards from matched-{YYYY-MM}.json with created_at
// set to the last day of that month at 12:00 JST.
// Usage: npx tsx scripts/import-data/import-matched.ts 2026-03
// Writes import-result-{YYYY-MM}.json for audit / rollback.

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const month = process.argv[2];
if (!month || !/^\d{4}-\d{2}$/.test(month)) {
  console.error("Usage: npx tsx import-matched.ts YYYY-MM");
  process.exit(1);
}

function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 0).getDate();
  return `${ym}-${String(d).padStart(2, "0")}T12:00:00+09:00`;
}
const CREATED_AT = lastDayOfMonth(month);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface Matched {
  line: number;
  matched: {
    to: { id: string; name: string };
    from: { id: string; name: string };
  };
  message: string;
}

(async () => {
  const matchedPath = path.join(__dirname, `matched-${month}.json`);
  if (!fs.existsSync(matchedPath)) {
    console.error(`matched file not found: ${matchedPath}`);
    process.exit(1);
  }
  const cards = JSON.parse(fs.readFileSync(matchedPath, "utf-8")) as Matched[];

  const empNumbers = Array.from(
    new Set(cards.flatMap((c) => [c.matched.to.id, c.matched.from.id]))
  );
  const { data: emps, error: empErr } = await supabase
    .from("employees")
    .select("id, employee_number")
    .in("employee_number", empNumbers);
  if (empErr || !emps) {
    console.error("emp lookup failed:", empErr?.message);
    process.exit(1);
  }
  const idOf = new Map(emps.map((e) => [e.employee_number, e.id as string]));

  console.log(`[${month}] importing ${cards.length} cards (created_at=${CREATED_AT})`);

  const results: Array<{ line: number; card_id?: string; error?: string }> = [];
  let ok = 0;
  let fail = 0;
  for (const c of cards) {
    const fromUuid = idOf.get(c.matched.from.id);
    const toUuid = idOf.get(c.matched.to.id);
    if (!fromUuid || !toUuid) {
      results.push({ line: c.line, error: "uuid resolve failed" });
      fail++;
      continue;
    }
    if (fromUuid === toUuid) {
      results.push({ line: c.line, error: "self-send skipped" });
      fail++;
      continue;
    }
    const { data, error } = await supabase
      .from("thanks_cards")
      .insert({
        from_id: fromUuid,
        to_id: toUuid,
        message: c.message,
        created_at: CREATED_AT,
      })
      .select("id")
      .single();
    if (error) {
      results.push({ line: c.line, error: error.message });
      fail++;
    } else {
      results.push({ line: c.line, card_id: data.id });
      ok++;
    }
  }

  console.log(`[${month}] done: ${ok} inserted, ${fail} failed`);
  fs.writeFileSync(
    path.join(__dirname, `import-result-${month}.json`),
    JSON.stringify({ month, created_at: CREATED_AT, total: cards.length, ok, fail, results }, null, 2),
    "utf-8"
  );
})();
