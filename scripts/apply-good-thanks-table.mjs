// Apply the good_thanks_votes migration to Supabase.
// Requires DATABASE_URL env var.
// Run: DATABASE_URL=... node scripts/apply-good-thanks-table.mjs
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var not set.");
  process.exit(1);
}
const sqlPath = path.resolve(__dirname, "../supabase/migrations/2026-04-25_good_thanks_votes.sql");
const sql = fs.readFileSync(sqlPath, "utf-8");
const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  await client.connect();
  try {
    await client.query(sql);
    console.log("good_thanks_votes table + policies applied.");
  } catch (err) {
    console.error("Failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
