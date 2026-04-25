import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  // Paginate through all users
  let allUsers: any[] = [];
  let page = 1;
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (!data?.users || data.users.length === 0) break;
    allUsers = allUsers.concat(data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  console.log("total auth users:", allUsers.length);
  const hayashi = allUsers.find((u) => u.email === "hayashi@thanks-card.local");
  console.log("hayashi:", hayashi ? { id: hayashi.id, email: hayashi.email } : "NOT FOUND");

  // Check if any cards reference hayashi's employee_id
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_number", "hayashi")
    .single();
  console.log("hayashi employee row:", emp);
  if (emp) {
    const { count: sent } = await supabase
      .from("thanks_cards")
      .select("*", { count: "exact", head: true })
      .eq("from_id", emp.id);
    const { count: received } = await supabase
      .from("thanks_cards")
      .select("*", { count: "exact", head: true })
      .eq("to_id", emp.id);
    console.log("cards from hayashi:", sent, "cards to hayashi:", received);
  }
})();
