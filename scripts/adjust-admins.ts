// One-off adjustment:
//   - Delete hayashi (cards referencing hayashi + employees row + Supabase Auth user)
//   - Update sumita location → "アイアルマーズ"
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function findAuthUser(email: string) {
  let page = 1;
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (!data?.users || data.users.length === 0) return null;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 1000) return null;
    page++;
  }
}

(async () => {
  // --- hayashi ---
  console.log("--- delete hayashi ---");

  const { data: hEmp } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_number", "hayashi")
    .single();

  if (hEmp) {
    // Delete cards where hayashi is from or to (CASCADE handles related rows)
    const { count: before } = await supabase
      .from("thanks_cards")
      .select("*", { count: "exact", head: true })
      .or(`from_id.eq.${hEmp.id},to_id.eq.${hEmp.id}`);
    console.log(`  cards involving hayashi: ${before}`);

    const { error: cardErr } = await supabase
      .from("thanks_cards")
      .delete()
      .or(`from_id.eq.${hEmp.id},to_id.eq.${hEmp.id}`);
    console.log("  cards delete:", cardErr?.message ?? "ok");

    const { error: empErr } = await supabase
      .from("employees")
      .delete()
      .eq("employee_number", "hayashi");
    console.log("  employees delete:", empErr?.message ?? "ok");
  } else {
    console.log("  employees: not found");
  }

  const authUser = await findAuthUser("hayashi@thanks-card.local");
  if (authUser) {
    const { error } = await supabase.auth.admin.deleteUser(authUser.id);
    console.log("  auth delete:", error?.message ?? "ok");
  } else {
    console.log("  auth: not found");
  }

  // --- sumita location ---
  console.log("--- update sumita location ---");
  const { data: updated, error: updErr } = await supabase
    .from("employees")
    .update({ location: "アイアルマーズ" })
    .eq("employee_number", "sumita")
    .select("employee_number, name, location")
    .single();
  console.log("  result:", updated, "err:", updErr?.message);

  // --- verify ---
  const { data: admins } = await supabase
    .from("employees")
    .select("employee_number, name, location, is_admin")
    .eq("is_admin", true)
    .order("employee_number");
  console.log("--- admins after ---");
  console.log(JSON.stringify(admins, null, 2));

  const { count: total } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true });
  console.log("employees total:", total);
})();
