// Apply the single new cards_delete policy to Supabase.
// Requires DATABASE_URL env var (postgresql://... connection string).
// Run: DATABASE_URL=... node scripts/apply-policy-cards-delete.mjs
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL env var not set. Get it from Supabase dashboard > Project Settings > Database."
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = `
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'thanks_cards'
      and policyname = 'cards_delete'
  ) then
    execute 'drop policy "cards_delete" on thanks_cards';
  end if;
end$$;

create policy "cards_delete" on thanks_cards for delete
  using (from_id = current_employee_id() or is_current_admin());
`;

(async () => {
  await client.connect();
  console.log("Connected.");
  try {
    await client.query(sql);
    console.log("cards_delete policy applied.");
  } catch (err) {
    console.error("Failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
