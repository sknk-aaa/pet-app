import { getDb } from '@/db/client';
import type { SettingKey } from '@/types';

export async function getSetting(key: SettingKey): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings(key, value) VALUES(?, ?)',
    [key, value]
  );
}

export async function getSettings(
  keys: SettingKey[]
): Promise<Partial<Record<SettingKey, string>>> {
  const db = await getDb();
  const placeholders = keys.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
    keys
  );
  const result: Partial<Record<SettingKey, string>> = {};
  for (const row of rows) {
    result[row.key as SettingKey] = row.value;
  }
  return result;
}
