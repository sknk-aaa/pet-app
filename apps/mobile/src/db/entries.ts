import * as FileSystem from 'expo-file-system';
import { getDb } from '@/db/client';
import { generateUUID } from '@/utils/uuid';
import { nowISOString, getTodayJST } from '@/utils/date';
import { updateStreakOnSave } from '@/db/streak';
import { getAllPets } from '@/db/pets';
import type {
  Entry,
  EntryWithPets,
  CalendarEntryInfo,
  CreateEntryInput,
  UpdateEntryInput,
  Pet,
} from '@/types';

async function attachPets(
  db: import('expo-sqlite').SQLiteDatabase,
  entries: Entry[]
): Promise<EntryWithPets[]> {
  if (entries.length === 0) return [];
  const allPets = await getAllPets();
  const petMap = new Map(allPets.map(p => [p.id, p]));

  const result: EntryWithPets[] = [];
  for (const entry of entries) {
    const petRows = await db.getAllAsync<{ pet_id: string }>(
      'SELECT pet_id FROM entry_pets WHERE entry_id = ?',
      [entry.id]
    );
    const pets: Pet[] = petRows
      .map(r => petMap.get(r.pet_id))
      .filter((p): p is Pet => p !== undefined);
    result.push({ ...entry, pets });
  }
  return result;
}

export async function getEntryByDate(date: string): Promise<EntryWithPets | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Entry>(
    'SELECT * FROM entries WHERE date = ?',
    [date]
  );
  if (!row) return null;
  return (await attachPets(db, [row]))[0];
}

export async function getEntryById(id: string): Promise<EntryWithPets | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Entry>(
    'SELECT * FROM entries WHERE id = ?',
    [id]
  );
  if (!row) return null;
  return (await attachPets(db, [row]))[0];
}

export async function getEntriesForMonth(
  year: number,
  month: number,
  petFilter: string
): Promise<CalendarEntryInfo[]> {
  const db = await getDb();
  const prefix = `${String(year)}-${String(month).padStart(2, '0')}`;

  let rows: Entry[];
  if (petFilter === 'all') {
    rows = await db.getAllAsync<Entry>(
      `SELECT id, date, thumbnail_uri, anniversary_tag_type, featured_status_cache
       FROM entries WHERE date LIKE ? ORDER BY date ASC`,
      [`${prefix}%`]
    );
  } else {
    rows = await db.getAllAsync<Entry>(
      `SELECT e.id, e.date, e.thumbnail_uri, e.anniversary_tag_type, e.featured_status_cache
       FROM entries e
       INNER JOIN entry_pets ep ON ep.entry_id = e.id
       WHERE e.date LIKE ? AND ep.pet_id = ?
       ORDER BY e.date ASC`,
      [`${prefix}%`, petFilter]
    );
  }
  return rows.map(r => ({
    date: r.date,
    thumbnail_uri: r.thumbnail_uri,
    anniversary_tag_type: r.anniversary_tag_type,
    featured_status_cache: r.featured_status_cache,
  }));
}

export async function getAnniversaryEntries(petFilter: string): Promise<EntryWithPets[]> {
  const db = await getDb();
  let rows: Entry[];
  if (petFilter === 'all') {
    rows = await db.getAllAsync<Entry>(
      `SELECT * FROM entries WHERE anniversary_tag_type IS NOT NULL
       ORDER BY date DESC`
    );
  } else {
    rows = await db.getAllAsync<Entry>(
      `SELECT e.* FROM entries e
       INNER JOIN entry_pets ep ON ep.entry_id = e.id
       WHERE e.anniversary_tag_type IS NOT NULL AND ep.pet_id = ?
       ORDER BY e.date DESC`,
      [petFilter]
    );
  }
  return attachPets(db, rows);
}

// ホームの「思い出」: 同月同日の過去エントリを優先、なければランダム
export async function getMemoryEntry(
  todayDate: string,
  petFilter: string
): Promise<Entry | null> {
  const db = await getDb();
  const [, month, day] = todayDate.split('-');
  const pattern = `%-${month}-${day}`;

  const baseWhere = petFilter === 'all'
    ? `date != ? AND date LIKE ?`
    : `date != ? AND date LIKE ? AND e.id IN (SELECT entry_id FROM entry_pets WHERE pet_id = ?)`;
  const baseParams = petFilter === 'all'
    ? [todayDate, pattern]
    : [todayDate, pattern, petFilter];

  const same = await db.getFirstAsync<Entry>(
    `SELECT * FROM entries WHERE ${baseWhere} ORDER BY RANDOM() LIMIT 1`,
    baseParams
  );
  if (same) return same;

  // 同月同日がなければランダム
  const randomWhere = petFilter === 'all'
    ? `date != ?`
    : `date != ? AND id IN (SELECT entry_id FROM entry_pets WHERE pet_id = ?)`;
  const randomParams = petFilter === 'all' ? [todayDate] : [todayDate, petFilter];
  return db.getFirstAsync<Entry>(
    `SELECT * FROM entries WHERE ${randomWhere} ORDER BY RANDOM() LIMIT 1`,
    randomParams
  );
}

export async function createEntry(
  data: CreateEntryInput,
  petIds: string[]
): Promise<EntryWithPets> {
  const db = await getDb();
  const id = generateUUID();
  const now = nowISOString();

  // 既存エントリチェック (streak 更新用)
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM entries WHERE date = ?',
    [data.date]
  );

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO entries(
         id, date, title, memo, image_uri, thumbnail_uri,
         anniversary_tag_type, anniversary_tag_name,
         featured_submitted, featured_candidate_id, featured_status_cache,
         created_at, updated_at
       ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)`,
      [
        id,
        data.date,
        data.title,
        data.memo ?? null,
        data.image_uri,
        data.thumbnail_uri,
        data.anniversary_tag_type ?? null,
        data.anniversary_tag_name ?? null,
        now,
        now,
      ]
    );

    for (const petId of petIds) {
      await db.runAsync(
        `INSERT OR IGNORE INTO entry_pets(id, entry_id, pet_id, created_at) VALUES(?, ?, ?, ?)`,
        [generateUUID(), id, petId, now]
      );
    }

    await updateStreakOnSave(db, data.date, existing !== null);
  });

  return (await getEntryById(id))!;
}

export async function updateEntry(
  id: string,
  data: UpdateEntryInput,
  petIds?: string[]
): Promise<void> {
  const db = await getDb();
  const now = nowISOString();
  const patch = { ...data, updated_at: now };
  const fields = Object.keys(patch).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(patch), id];

  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE entries SET ${fields} WHERE id = ?`, values);
    if (petIds !== undefined) {
      await db.runAsync('DELETE FROM entry_pets WHERE entry_id = ?', [id]);
      for (const petId of petIds) {
        await db.runAsync(
          `INSERT OR IGNORE INTO entry_pets(id, entry_id, pet_id, created_at) VALUES(?, ?, ?, ?)`,
          [generateUUID(), id, petId, now]
        );
      }
    }
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();

  // 写真ファイルを削除
  const entry = await db.getFirstAsync<{ image_uri: string; thumbnail_uri: string }>(
    'SELECT image_uri, thumbnail_uri FROM entries WHERE id = ?',
    [id]
  );
  if (entry) {
    await FileSystem.deleteAsync(entry.image_uri, { idempotent: true });
    await FileSystem.deleteAsync(entry.thumbnail_uri, { idempotent: true });
  }

  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}

// entries の featured_* カラムを更新
export async function updateEntryFeaturedState(
  id: string,
  featuredSubmitted: 0 | 1,
  featuredCandidateId: string | null,
  featuredStatusCache: string | null
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE entries
     SET featured_submitted = ?,
         featured_candidate_id = ?,
         featured_status_cache = ?,
         updated_at = ?
     WHERE id = ?`,
    [featuredSubmitted, featuredCandidateId, featuredStatusCache, nowISOString(), id]
  );
}
