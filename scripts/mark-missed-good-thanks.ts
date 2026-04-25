// Mark the 4 remaining good-thanks cards by exact message match (regardless of
// from/to mismatch in the source xlsx — the picks reference real cards).
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KEYS = [
  // row300
  "製品充填中、1mmサイズの異物も見逃さず発見、報告してくださりありがとうございます",
  // row390
  "先日は元箱根店に勤務していただきありがとうございます。約1年ぶりに一緒に仕事をする",
  // row504
  "わからないことをいつ聞いても、丁寧に答えてくださり、掃除も色々と一から教えていただいて",
  // row590
  "気づいたときに、充填機を洗っていただいたり、Aラインのお手伝いに来ていただいてありがとうございました",
];

(async () => {
  let ok = 0, miss = 0;
  for (const key of KEYS) {
    const { data: cards } = await s
      .from("thanks_cards")
      .select("id, message")
      .ilike("message", `%${key.slice(0, 28)}%`);
    if (!cards || cards.length === 0) {
      console.log(`  [no match] ${key.slice(0, 30)}`);
      miss++;
      continue;
    }
    for (const c of cards) {
      const { error } = await s.from("thanks_cards").update({ is_picked: true }).eq("id", c.id);
      if (error) {
        console.log(`  [err] ${c.id}: ${error.message}`);
        miss++;
      } else {
        console.log(`  ✓ marked ${c.id.slice(0, 8)}: ${c.message.slice(0, 30)}`);
        ok++;
      }
    }
  }
  console.log(`done: ${ok} marked, ${miss} miss`);
  const { count } = await s
    .from("thanks_cards")
    .select("*", { count: "exact", head: true })
    .eq("is_picked", true);
  console.log(`is_picked total now: ${count}`);
})();
