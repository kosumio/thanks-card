import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  const { count: total } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true });
  const { count: admin } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("is_admin", true);
  console.log("employees total:", total, "/ admins:", admin);

  const { data: admins } = await supabase
    .from("employees")
    .select("employee_number, name, birthdate, is_admin")
    .eq("is_admin", true)
    .order("employee_number");
  console.log("admin accounts:", JSON.stringify(admins, null, 2));

  // Check that legacy accounts are gone
  const { data: legacy } = await supabase
    .from("employees")
    .select("employee_number, name")
    .in("employee_number", ["0001", "0002", "0003", "0004", "0005", "9999"]);
  console.log("legacy accounts remaining:", legacy?.length ?? 0);
})();
