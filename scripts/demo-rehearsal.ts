// Demo rehearsal: simulate what each role will see for the 4/28 meeting.
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  // 1. employee count + admin count
  const { count: empTotal } = await s.from("employees").select("*", { count: "exact", head: true });
  const { count: adminCount } = await s.from("employees").select("*", { count: "exact", head: true }).eq("is_admin", true);
  console.log(`employees=${empTotal} (admin=${adminCount})`);

  // 2. card stats
  const { count: cardTotal } = await s.from("thanks_cards").select("*", { count: "exact", head: true });
  const { count: pickedTotal } = await s.from("thanks_cards").select("*", { count: "exact", head: true }).eq("is_picked", true);
  console.log(`cards=${cardTotal} picked=${pickedTotal}`);

  // 3. demo accounts
  console.log("\n--- demo accounts (FY2025 通期) ---");
  const demos = [
    { num: "sumita",   role: "管理者・天神経営" },
    { num: "10079",    role: "管理者・緑川好美 (経営企画室)" },
    { num: "10053",    role: "管理者・中上征三 (HD管理部)" },
    { num: "10020",    role: "一般・猪俣剛史 (アバロン営業課)" },
    { num: "240917",   role: "一般・梅田悠佳 (もらった1位)" },
    { num: "tmp-001",  role: "仮登録・香川知世 (もらった3位)" },
  ];
  for (const d of demos) {
    const { data: emp } = await s
      .from("employees")
      .select("id, name, location, is_admin")
      .eq("employee_number", d.num)
      .single();
    if (!emp) { console.log(`  ${d.num}: NOT FOUND`); continue; }
    const start = "2025-04-01T00:00:00+09:00";
    const end = "2026-04-01T00:00:00+09:00";
    const { count: recv } = await s
      .from("thanks_cards")
      .select("*", { count: "exact", head: true })
      .eq("to_id", emp.id).gte("created_at", start).lt("created_at", end);
    const { count: sent } = await s
      .from("thanks_cards")
      .select("*", { count: "exact", head: true })
      .eq("from_id", emp.id).gte("created_at", start).lt("created_at", end);
    const { data: pickedRecv } = await s
      .from("thanks_cards")
      .select("id")
      .eq("to_id", emp.id).eq("is_picked", true)
      .gte("created_at", start).lt("created_at", end);
    const { data: pickedSent } = await s
      .from("thanks_cards")
      .select("id")
      .eq("from_id", emp.id).eq("is_picked", true)
      .gte("created_at", start).lt("created_at", end);
    const picked = (pickedRecv?.length ?? 0) + (pickedSent?.length ?? 0);
    console.log(
      `  ${d.num.padEnd(9)} [${emp.is_admin ? "ADMIN" : "user"}] ${emp.name} (${emp.location})` +
      `\n    もらった=${recv} / 贈った=${sent} / 好事例=${picked} (受=${pickedRecv?.length ?? 0}+贈=${pickedSent?.length ?? 0})  — ${d.role}`
    );
  }

  // 4. category distribution (none for historical imports — by design)
  const { count: catLinkCount } = await s.from("card_categories").select("*", { count: "exact", head: true });
  console.log(`\ncard_categories rows: ${catLinkCount} (historical imports に紐付けはなし)`);

  // 5. live URL probe
  console.log("\nlive: https://thanks-card-five.vercel.app/login");
})();
