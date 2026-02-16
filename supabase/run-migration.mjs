/**
 * Migration runner — connects to Supabase via connection pooler.
 *
 * Usage:
 *   DB_URL="postgresql://postgres.ref:password@host:5432/postgres" node supabase/run-migration.mjs
 *
 * Note: In WSL, the direct Supabase DB host (db.*.supabase.co) is IPv6-only.
 * Use the Supabase SQL Editor for migrations, or provide a pooler connection string.
 */
import { readFileSync } from "fs";
import pg from "pg";

async function run() {
  const connectionString = process.env.DB_URL;
  if (!connectionString) {
    console.error("Error: Set DB_URL environment variable with your Supabase connection string");
    process.exit(1);
  }

  const sql = readFileSync(
    new URL("./migrations/001_initial_schema.sql", import.meta.url),
    "utf-8"
  );

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to database");

  try {
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
