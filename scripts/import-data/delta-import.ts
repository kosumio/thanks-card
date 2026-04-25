// Delta import: insert only the newly-matched cards that weren't in
// the previous import-result-{month}.json. Used after adding new
// employees to roster.
// Usage: npx tsx scripts/import-data/delta-import.ts YYYY-MM

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const month = process.argv[2];
if (!month || !/^\d{4}-\d{2}$/.test(month)) {
  console.error("Usage: npx tsx delta-import.ts YYYY-MM");
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
  matched: { to: { id: string; name: string }; from: { id: string; name: string } };
  message: string;
}

(async () => {
  const matchedPath = path.join(__dirname, `matched-${month}.json`);
  const resultPath = path.join(__dirname, `import-result-${month}.json`);
  const matched = JSON.parse(fs.readFileSync(matchedPath, "utf-8")) as Matched[];

  let alreadyImported = new Set<number>();
  if (fs.existsSync(resultPath)) {
    const prev = JSON.parse(fs.readFileSync(resultPath, "utf-8"));
    const results = prev.results || [];
    for (const r of results) {
      if (r.card_id) alreadyImported.add(r.line);
    }
  }

  const toImport = matched.filter((c) => !alreadyImported.has(c.line));
  console.log(`[${month}] matched=${matched.length} already=${alreadyImported.size} delta=${toImport.length}`);
  if (toImport.length === 0) return;

  const empNumbers = Array.from(new Set(toImport.flatMap((c) => [c.matched.to.id, c.matched.from.id])));
  const { data: emps } = await supabase
    .from("employees")
    .select("id, employee_number")
    .in("employee_number", empNumbers);
  const idOf = new Map((emps || []).map((e) => [e.employee_number, e.id as string]));

  const newResults: Array<{ line: number; card_id?: string; error?: string }> = [];
  let ok = 0, fail = 0;
  for (const c of toImport) {
    const fromUuid = idOf.get(c.matched.from.id);
    const toUuid = idOf.get(c.matched.to.id);
    if (!fromUuid || !toUuid || fromUuid === toUuid) {
      newResults.push({ line: c.line, error: "skip" });
      fail++;
      continue;
    }
    const { data, error } = await supabase
      .from("thanks_cards")
      .insert({ from_id: fromUuid, to_id: toUuid, message: c.message, created_at: CREATED_AT })
      .select("id")
      .single();
    if (error) {
      newResults.push({ line: c.line, error: error.message });
      fail++;
    } else {
      newResults.push({ line: c.line, card_id: data.id });
      ok++;
    }
  }

  // Merge into existing import-result file
  const merged = fs.existsSync(resultPath)
    ? JSON.parse(fs.readFileSync(resultPath, "utf-8"))
    : { month, created_at: CREATED_AT, total: 0, ok: 0, fail: 0, results: [] };
  merged.results = (merged.results || []).concat(newResults);
  merged.total = (merged.total || 0) + toImport.length;
  merged.ok = (merged.ok || 0) + ok;
  merged.fail = (merged.fail || 0) + fail;
  fs.writeFileSync(resultPath, JSON.stringify(merged, null, 2), "utf-8");

  console.log(`[${month}] delta: ${ok} inserted, ${fail} failed`);
})();
