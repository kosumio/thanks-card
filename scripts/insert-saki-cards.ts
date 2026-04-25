// Add 2 cards: 秋山勇気 → 矢嶋寛 / 土田健太
// (Original TSV had #CALC! placeholder; xlsx pick was for "崎次郎スタッフ"
// which we expand to the 2 actual members of 崎次郎事業部.)
// Both cards marked is_picked=true.
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FROM = "秋山勇気";
const TARGETS = ["矢嶋　寛", "土田健太"];
const MSG =
  "ベルクの仕分けの時、においで、魚がよくないことに気付いてくれてありがとうございます。「作業」でなく「仕事」。その姿勢に敬意を！";
const CREATED = "2026-01-31T12:00:00+09:00";

(async () => {
  const { data: emps } = await s.from("employees").select("id, name");
  const id = new Map(emps!.map((e) => [e.name, e.id]));
  const fromId = id.get(FROM);
  if (!fromId) {
    console.error("from not found:", FROM);
    return;
  }
  for (const t of TARGETS) {
    const toId = id.get(t);
    if (!toId) {
      console.error("to not found:", t);
      continue;
    }
    const { data, error } = await s
      .from("thanks_cards")
      .insert({
        from_id: fromId,
        to_id: toId,
        message: MSG,
        is_picked: true,
        created_at: CREATED,
      })
      .select("id")
      .single();
    if (error) {
      console.error(`[err] -> ${t}: ${error.message}`);
    } else {
      console.log(`✓ ${FROM} -> ${t}  card=${data.id.slice(0, 8)}`);
    }
  }
  const { count } = await s
    .from("thanks_cards")
    .select("*", { count: "exact", head: true })
    .eq("is_picked", true);
  console.log(`is_picked total: ${count}`);
})();
