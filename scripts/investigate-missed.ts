// Investigate the 6 unmarked good-thanks picks to determine resolution.
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Case {
  label: string;
  msgKey: string;
  expectedTo?: string;
  expectedFrom?: string;
}

const cases: Case[] = [
  { label: "row300 松嶋基→葛屋柚香", msgKey: "製品充填中、1mmサイズの異物" },
  { label: "row346 吉田栄作→皆さま", msgKey: "倉庫、駐車場の草取り" },
  { label: "row390 香川知世→佐々木千奈美", msgKey: "先日は元箱根店に勤務" },
  { label: "row445 松嶋基→尾崎寛", msgKey: "トイレの水道の水が止まりきっていないこと" },
  { label: "row504 葛屋柚香→太田郁子", msgKey: "わからないことをいつ聞いても、丁寧に答えて" },
  { label: "row590 葛屋柚香→福田梨沙", msgKey: "気づいたときに、充填機を洗っていただいたり、Aライン" },
  { label: "row616 秋山勇気→崎次郎スタッフ", msgKey: "ベルクの仕分けの時、においで、魚がよくない" },
];

(async () => {
  for (const c of cases) {
    console.log(`\n=== ${c.label} ===`);
    console.log(`  key: "${c.msgKey}"`);
    const { data: cards } = await s
      .from("thanks_cards")
      .select(
        "id, message, created_at, is_picked, from:employees!from_id(name, location), to:employees!to_id(name, location)"
      )
      .ilike("message", `%${c.msgKey.slice(0, 18)}%`);
    if (!cards || cards.length === 0) {
      console.log("  -> no DB card matches this message");
      continue;
    }
    for (const card of cards as any[]) {
      console.log(
        `  card id=${card.id.slice(0, 8)} ${card.created_at.slice(0, 10)} from=${card.from.name}(${card.from.location}) -> to=${card.to.name}(${card.to.location}) picked=${card.is_picked}`
      );
      console.log(`    msg: ${card.message.slice(0, 80)}`);
    }
  }
})();
