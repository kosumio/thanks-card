// Mimic the login action's query against Supabase to identify the failure mode.
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const tests = [
  { emp: "sumita", bd: "1988-08-01" },
  { emp: "hayashi", bd: "1991-08-28" },
  { emp: "10020", bd: "1976-12-02" },
];

(async () => {
  for (const t of tests) {
    console.log(`--- ${t.emp} / ${t.bd} ---`);

    // 1. Check employees row
    const { data: emp, error: empErr } = await admin
      .from("employees")
      .select("id, employee_number, name, birthdate, is_active, is_admin")
      .eq("employee_number", t.emp)
      .single();
    console.log("  row:", emp, "err:", empErr?.message);

    if (!emp) continue;

    // 2. Check the EXACT same query the login action uses
    const { data: match, error: matchErr } = await admin
      .from("employees")
      .select("id, employee_number, birthdate")
      .eq("employee_number", t.emp)
      .eq("birthdate", t.bd)
      .eq("is_active", true)
      .single();
    console.log("  login lookup:", match, "err:", matchErr?.message);

    // 3. Try actual auth signin
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const email = `${emp.employee_number}@thanks-card.local`;
    const password = `tc_${emp.birthdate}_${emp.employee_number}`;
    const { data: session, error: signErr } = await anon.auth.signInWithPassword({
      email,
      password,
    });
    console.log("  auth signin:", session?.user?.id ?? "FAIL", "err:", signErr?.message);
  }
})();
