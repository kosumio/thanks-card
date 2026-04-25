// One-off: switch all Supabase Auth user passwords to `tc_${emp_number}`
// (no more birthdate). Also creates auth users for the 6 placeholder
// employees and flips them to is_active=true so they can be selected
// as recipients and (later) log in.

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const PLACEHOLDER_NUMS = ["4", "6", "10012", "10021", "10053", "10079"];

async function listAllAuthUsers() {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (!data?.users || data.users.length === 0) break;
    all.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  return all;
}

(async () => {
  // 1. Activate the 6 placeholder accounts so they can be selected/recipients
  console.log("--- activate placeholder accounts ---");
  const { data: activated } = await supabase
    .from("employees")
    .update({ is_active: true })
    .in("employee_number", PLACEHOLDER_NUMS)
    .select("employee_number, name");
  console.log("activated:", activated?.length, activated?.map((e) => `${e.employee_number}/${e.name}`).join(", "));

  // 2. Fetch all employees + auth users
  const { data: emps } = await supabase
    .from("employees")
    .select("id, employee_number, is_admin");
  const authUsers = await listAllAuthUsers();
  const authByEmail = new Map(authUsers.map((u) => [u.email, u]));

  console.log(`employees=${emps?.length} authUsers=${authUsers.length}`);

  // 3. For each employee: ensure auth user exists with `tc_${emp_number}` password
  let created = 0, updated = 0, errors = 0;
  for (const emp of emps || []) {
    const email = `${emp.employee_number}@thanks-card.local`;
    const password = `tc_${emp.employee_number}`;
    const meta = { employee_id: emp.id, is_admin: emp.is_admin };

    const existing = authByEmail.get(email);
    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password,
        app_metadata: meta,
      });
      if (error) {
        console.error(`[update err] ${emp.employee_number}: ${error.message}`);
        errors++;
      } else {
        updated++;
      }
    } else {
      const { error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: meta,
      });
      if (error) {
        console.error(`[create err] ${emp.employee_number}: ${error.message}`);
        errors++;
      } else {
        created++;
      }
    }
  }

  console.log(`done: created=${created} updated=${updated} errors=${errors}`);
})();
