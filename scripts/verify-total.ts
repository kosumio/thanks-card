import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { count } = await s.from("thanks_cards").select("*", { count: "exact", head: true });
  console.log("total cards in DB:", count);
  const months = ["2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03"];
  for (const m of months) {
    const [y, mo] = m.split("-");
    const start = `${m}-01T00:00:00+09:00`;
    const endM = parseInt(mo);
    const endY = endM === 12 ? parseInt(y)+1 : parseInt(y);
    const endMo = endM === 12 ? 1 : endM+1;
    const end = `${endY}-${String(endMo).padStart(2,"0")}-01T00:00:00+09:00`;
    const { count: c } = await s.from("thanks_cards").select("*", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end);
    console.log(`  ${m}: ${c}`);
  }
})();
