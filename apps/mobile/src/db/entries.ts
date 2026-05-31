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
      `SELECT pet_id FROM entry_pets WHERE entry_id = ?
       ORDER BY CASE WHEN pet_id = ? THEN 0 ELSE 1 END`,
      [entry.id, entry.primary_pet_id ?? '']
    );
    const pets: Pet[] = petRows
      .map(r => petMap.get(r.pet_id))
      .filter((p): p is Pet => p !== undefined);
    result.push({ ...entry, pets });
  }
  return result;
}

export async function getEntryByDate(date: string, primaryPetId: string): Promise<EntryWithPets | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Entry>(
    'SELECT * FROM entries WHERE date = ? AND primary_pet_id = ?',
    [date, primaryPetId]
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
  primaryPetId: string | null
): Promise<CalendarEntryInfo[]> {
  const db = await getDb();
  const prefix = `${String(year)}-${String(month).padStart(2, '0')}`;

  let rows: Entry[];
  if (!primaryPetId) {
    rows = await db.getAllAsync<Entry>(
      `SELECT id, date, thumbnail_uri, anniversary_tag_type, featured_status_cache
       FROM entries WHERE date LIKE ? ORDER BY date ASC`,
      [`${prefix}%`]
    );
  } else {
    rows = await db.getAllAsync<Entry>(
      `SELECT id, date, thumbnail_uri, anniversary_tag_type, featured_status_cache
       FROM entries WHERE date LIKE ? AND primary_pet_id = ?
       ORDER BY date ASC`,
      [`${prefix}%`, primaryPetId]
    );
  }
  return rows.map(r => ({
    date: r.date,
    thumbnail_uri: r.thumbnail_uri,
    anniversary_tag_type: r.anniversary_tag_type,
    featured_status_cache: r.featured_status_cache,
  }));
}

export async function getAnniversaryEntries(primaryPetId: string | null): Promise<EntryWithPets[]> {
  const db = await getDb();
  let rows: Entry[];
  if (!primaryPetId) {
    rows = await db.getAllAsync<Entry>(
      `SELECT * FROM entries WHERE anniversary_tag_type IS NOT NULL ORDER BY date DESC`
    );
  } else {
    rows = await db.getAllAsync<Entry>(
      `SELECT * FROM entries WHERE anniversary_tag_type IS NOT NULL AND primary_pet_id = ?
       ORDER BY date DESC`,
      [primaryPetId]
    );
  }
  return attachPets(db, rows);
}

export async function getMemoryEntry(
  todayDate: string,
  primaryPetId: string | null
): Promise<Entry | null> {
  const db = await getDb();
  const params = primaryPetId ? [todayDate, primaryPetId] : [todayDate];
  return db.getFirstAsync<Entry>(
    `SELECT * FROM entries WHERE date != ?${primaryPetId ? ' AND primary_pet_id = ?' : ''} ORDER BY RANDOM() LIMIT 1`,
    params
  );
}

export async function createEntry(
  data: CreateEntryInput,
  petIds: string[]
): Promise<EntryWithPets> {
  const db = await getDb();
  const id = generateUUID();
  const now = nowISOString();
  const primaryPetId = petIds[0] ?? null;

  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM entries WHERE date = ? AND primary_pet_id = ?',
    [data.date, primaryPetId]
  );

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO entries(
         id, date, primary_pet_id, title, memo, image_uri, thumbnail_uri,
         anniversary_tag_type, anniversary_tag_name,
         featured_submitted, featured_candidate_id, featured_status_cache,
         created_at, updated_at
       ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)`,
      [
        id,
        data.date,
        primaryPetId,
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
  const patch: Record<string, string | number | null> = { ...data as Record<string, string | number | null>, updated_at: now };
  if (petIds !== undefined && petIds.length > 0) {
    patch.primary_pet_id = petIds[0];
  }
  const fields = Object.keys(patch).map(k => `${k} = ?`).join(', ');
  const values: (string | number | null)[] = [...Object.values(patch), id];

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

export async function getAllEntries(primaryPetId: string | null): Promise<CalendarEntryInfo[]> {
  const db = await getDb();
  let rows: Entry[];
  if (!primaryPetId) {
    rows = await db.getAllAsync<Entry>(
      `SELECT id, date, thumbnail_uri, anniversary_tag_type, featured_status_cache
       FROM entries ORDER BY date DESC`
    );
  } else {
    rows = await db.getAllAsync<Entry>(
      `SELECT id, date, thumbnail_uri, anniversary_tag_type, featured_status_cache
       FROM entries WHERE primary_pet_id = ? ORDER BY date DESC`,
      [primaryPetId]
    );
  }
  return rows.map(r => ({
    date:                 r.date,
    thumbnail_uri:        r.thumbnail_uri,
    anniversary_tag_type: r.anniversary_tag_type,
    featured_status_cache: r.featured_status_cache,
  }));
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();

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
