// Insert the 45 tmp-NNN placeholder employees into Supabase + create their
// Auth users so login-by-name works, ranking includes them, and the
// previously-unmatched cards can now be linked.
//
// Reads scripts/import-data/placeholder-employees.json (gitignore-safe).

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface PlaceholderEmp {
  employee_number: string;
  name: string;
  name_kana: string;
  location: string;
  birthdate: string;
  is_admin: boolean;
}

(async () => {
  const file = path.resolve(__dirname, "import-data/placeholder-employees.json");
  const list = JSON.parse(fs.readFileSync(file, "utf-8")) as PlaceholderEmp[];
  console.log(`--- inserting ${list.length} placeholder employees ---`);

  let ok = 0, errs = 0;
  for (const e of list) {
    // 1. Upsert employees row (is_active defaults to true)
    const { data: empRow, error: empErr } = await supabase
      .from("employees")
      .upsert(e, { onConflict: "employee_number" })
      .select("id")
      .single();
    if (empErr || !empRow) {
      console.error(`[emp err] ${e.name}: ${empErr?.message}`);
      errs++;
      continue;
    }

    // 2. Create auth user
    const email = `${e.employee_number}@thanks-card.local`;
    const password = `tc_${e.employee_number}`;
    const { error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { employee_id: empRow.id, is_admin: false },
    });
    if (authErr && !authErr.message.includes("already been registered")) {
      console.error(`[auth err] ${e.name}: ${authErr.message}`);
      errs++;
      continue;
    }
    ok++;
  }

  console.log(`done: ${ok} ok, ${errs} errors`);

  const { count } = await supabase.from("employees").select("*", { count: "exact", head: true });
  console.log(`employees total now: ${count}`);
})();
