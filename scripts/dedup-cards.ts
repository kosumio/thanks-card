// Remove the 1 duplicate row found by audit.
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
(async () => {
  const { data: cards } = await s
    .from("thanks_cards")
    .select("id, from_id, to_id, message, created_at")
    .order("created_at");
  const groups = new Map<string, string[]>();
  for (const c of cards || []) {
    const k = `${c.from_id}|${c.to_id}|${c.message}|${c.created_at}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(c.id);
  }
  for (const ids of groups.values()) {
    if (ids.length > 1) {
      const toDelete = ids.slice(1);
      const { error } = await s.from("thanks_cards").delete().in("id", toDelete);
      console.log(`deleted ${toDelete.length} dup of group keeping ${ids[0]}:`, error?.message ?? "ok");
    }
  }
  const { count } = await s.from("thanks_cards").select("*", { count: "exact", head: true });
  console.log("total now:", count);
})();
