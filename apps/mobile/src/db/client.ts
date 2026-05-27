import * as SQLite from 'expo-sqlite';
import { nowISOString } from '@/utils/date';
import { migration001 } from '@/db/migrations/001_init';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  const db = await SQLite.openDatabaseAsync('petdiary.db');
  try {
    await runMigrations(db);
    _db = db;
    return db;
  } catch (error) {
    console.error('[db] initialization failed', error);
    await db.closeAsync().catch(() => {});
    throw error;
  }
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // schema_version テーブルが存在しない可能性があるため CREATE TABLE で確保
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const current = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
  );
  const currentVersion = current?.version ?? 0;

  const migrations: Array<{ version: number; run: (db: SQLite.SQLiteDatabase) => Promise<void> }> = [
    { version: 1, run: migration001 },
  ];

  for (const m of migrations) {
    if (m.version > currentVersion) {
      await db.withTransactionAsync(async () => {
        await m.run(db);
        await db.runAsync(
          'INSERT INTO schema_version(version, applied_at) VALUES(?, ?)',
          [m.version, nowISOString()]
        );
      });
    }
  }

  // Recover installations where schema_version was written but v1 tables are missing.
  const petsTable = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pets'"
  );
  if (!petsTable) {
    console.warn('[db] repairing incomplete initial schema');
    await db.withTransactionAsync(async () => {
      await migration001(db);
      await db.runAsync(
        'INSERT OR REPLACE INTO schema_version(version, applied_at) VALUES(?, ?)',
        [1, nowISOString()]
      );
    });
  }
}
