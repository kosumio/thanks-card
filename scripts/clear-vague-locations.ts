// Clear location for placeholders whose location was only a company name
// (no specific dept) AND who weren't found in LINEWORKS or 中上 Excel.
// Per 角田 instruction 2026-04-25.

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TARGETS = ["tmp-010", "tmp-011", "tmp-024", "tmp-025", "tmp-032"];

(async () => {
  const { data, error } = await supabase
    .from("employees")
    .update({ location: "" })
    .in("employee_number", TARGETS)
    .select("employee_number, name, location");
  console.log("updated:", data?.length, "err:", error?.message);
  for (const r of data || []) {
    console.log(`  ${r.employee_number} ${r.name} location='${r.location}'`);
  }
})();
