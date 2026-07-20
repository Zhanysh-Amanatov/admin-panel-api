/*External dependencies */
import fs from "fs";
import path from "path";

/*Local dependencies */
import pool from "../config/db";

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log("Running database migrations...");

    const sqlPath = path.join(__dirname, "../migrations/users_table.sql");

    const sql = fs.readFileSync(sqlPath, "utf8");

    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");

    console.log("Migrations applied successfully");
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
