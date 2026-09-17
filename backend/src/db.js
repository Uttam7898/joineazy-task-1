import pg from "pg";
import { newDb } from "pg-mem";

const { Pool } = pg;

let activePool = null;
let isMemDb = false;

const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "joineazy",
  password: process.env.POSTGRES_PASSWORD || "joineazy",
  database: process.env.POSTGRES_DB || "joineazy",
  connectionTimeoutMillis: 2000,
});

export const pool = {
  query: (text, params) => activePool.query(text, params),
};

export async function query(text, params) {
  return activePool.query(text, params);
}

export async function waitForDb(retries = 2) {
  for (let i = 1; i <= retries; i += 1) {
    try {
      await pgPool.query("SELECT 1");
      activePool = pgPool;
      console.log("[DB] Connected to PostgreSQL successfully.");
      return;
    } catch (err) {
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }

  // Fallback to in-memory Postgres database (pg-mem)
  console.log("[DB] PostgreSQL server not reachable. Automatically initialized in-memory database engine (pg-mem).");
  const memDb = newDb();
  const memPg = memDb.adapters.createPg();
  activePool = new memPg.Pool();
  isMemDb = true;
}
