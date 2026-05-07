import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { SEED_SQL } from "./seed";

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let initPromise: Promise<void> | null = null;

async function init() {
  if (db) return;
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: () => "/sql-wasm.wasm" });
  }
  db = new SQL.Database();
  db.exec(SEED_SQL);
}

export function ensureDb() {
  if (!initPromise) initPromise = init();
  return initPromise;
}

export function resetDb() {
  if (db) {
    db.close();
    db = null;
  }
  initPromise = null;
  return ensureDb();
}

export type QueryResult =
  | { ok: true; columns: string[]; rows: unknown[][]; rowCount: number; ms: number }
  | { ok: false; error: string };

export async function runQuery(sql: string): Promise<QueryResult> {
  await ensureDb();
  if (!db) return { ok: false, error: "Database not initialized" };
  const start = performance.now();
  try {
    const results = db.exec(sql);
    const ms = +(performance.now() - start).toFixed(1);
    if (results.length === 0) {
      return { ok: true, columns: [], rows: [], rowCount: 0, ms };
    }
    const last = results[results.length - 1];
    return {
      ok: true,
      columns: last.columns,
      rows: last.values,
      rowCount: last.values.length,
      ms,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function listTables() {
  await ensureDb();
  if (!db) return [];
  const res = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  if (!res.length) return [];
  return res[0].values.map((r) => r[0] as string);
}

export async function describeTable(name: string) {
  await ensureDb();
  if (!db) return [];
  const res = db.exec(`PRAGMA table_info(${name})`);
  if (!res.length) return [];
  return res[0].values.map((r) => ({
    name: r[1] as string,
    type: r[2] as string,
    pk: r[5] as number,
  }));
}
