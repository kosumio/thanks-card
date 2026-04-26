import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  const { data: emps } = await s
    .from("employees")
    .select("id, name, location, is_active");
  const list = (emps ?? []).filter((e) => e.name.includes("中上"));
  console.log("matches:", list);

  if (list.length === 0) return;
  for (const target of list) {
    const recv = await s
      .from("thanks_cards")
      .select("id", { count: "exact", head: true })
      .eq("to_id", target.id);
    const sent = await s
      .from("thanks_cards")
      .select("id", { count: "exact", head: true })
      .eq("from_id", target.id);
    const reacts = await s
      .from("card_reactions")
      .select("card_id, thanks_cards!inner(to_id)", { count: "exact", head: true })
      .eq("thanks_cards.to_id", target.id);
    console.log(`${target.name} (${target.location}, active=${target.is_active}): received=${recv.count}, sent=${sent.count}, hearts=${reacts.count}`);

    // top per month
    const { data: cards } = await s
      .from("thanks_cards")
      .select("id, to_id, created_at, card_reactions(user_id)")
      .or(`to_id.eq.${target.id},from_id.eq.${target.id}`);
    const byMonth: Record<string, { recv: number; sent: number; hearts: number }> = {};
    for (const c of cards ?? []) {
      const k = c.created_at.slice(0, 7);
      byMonth[k] ??= { recv: 0, sent: 0, hearts: 0 };
      if (c.to_id === target.id) {
        byMonth[k].recv++;
        byMonth[k].hearts += (c.card_reactions as { user_id: string }[] | null)?.length ?? 0;
      }
      else byMonth[k].sent++;
    }
    console.log("  by month:", byMonth);
  }
})();
