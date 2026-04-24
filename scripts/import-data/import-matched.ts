// Import fully-matched cards from matched.json into thanks_cards table.
// created_at is set to 2026-03-31 12:00 JST (month-end convention per CEO).
// Writes import-result.json with inserted card ids for audit / rollback.

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Month-end timestamp for 2026-03 cards
const CREATED_AT = "2026-03-31T12:00:00+09:00";

interface Matched {
  line: number;
  matched: {
    to: { id: string; name: string };
    from: { id: string; name: string };
  };
  message: string;
}

(async () => {
  const raw = fs.readFileSync(path.join(__dirname, "matched.json"), "utf-8");
  const cards = JSON.parse(raw) as Matched[];

  // Resolve employee_number -> uuid
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

  console.log(`--- importing ${cards.length} cards (created_at=${CREATED_AT}) ---`);

  const results: Array<{ line: number; card_id?: string; error?: string }> = [];
  for (const c of cards) {
    const fromUuid = idOf.get(c.matched.from.id);
    const toUuid = idOf.get(c.matched.to.id);
    if (!fromUuid || !toUuid) {
      console.error(`  line ${c.line}: could not resolve uuid`);
      results.push({ line: c.line, error: "uuid resolve failed" });
      continue;
    }
    if (fromUuid === toUuid) {
      console.error(`  line ${c.line}: from === to, skipped`);
      results.push({ line: c.line, error: "self-send skipped" });
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
      console.error(`  line ${c.line}: ${error.message}`);
      results.push({ line: c.line, error: error.message });
    } else {
      console.log(
        `  line ${c.line}: ${c.matched.from.name} → ${c.matched.to.name}  (card ${data.id})`
      );
      results.push({ line: c.line, card_id: data.id });
    }
  }

  const ok = results.filter((r) => r.card_id).length;
  const fail = results.filter((r) => r.error).length;
  console.log(`--- done: ${ok} inserted, ${fail} failed ---`);

  fs.writeFileSync(
    path.join(__dirname, "import-result.json"),
    JSON.stringify({ created_at: CREATED_AT, total: cards.length, results }, null, 2),
    "utf-8"
  );
})();
