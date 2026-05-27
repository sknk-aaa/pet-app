import { getDb } from '@/db/client';
import { generateUUID } from '@/utils/uuid';
import { nowISOString, getYesterdayJST } from '@/utils/date';
import type { PendingUpload, PendingUploadType } from '@/types';

export async function addPendingUpload(
  type: PendingUploadType,
  payload: object
): Promise<string> {
  const db = await getDb();
  const id = generateUUID();
  await db.runAsync(
    `INSERT INTO pending_uploads(id, type, payload, attempt_count, created_at)
     VALUES(?, ?, ?, 0, ?)`,
    [id, type, JSON.stringify(payload), nowISOString()]
  );
  return id;
}

export async function getPendingUploads(): Promise<PendingUpload[]> {
  const db = await getDb();
  return db.getAllAsync<PendingUpload>(
    'SELECT * FROM pending_uploads ORDER BY created_at ASC'
  );
}

export async function updateAttempt(id: string, error?: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE pending_uploads
     SET attempt_count = attempt_count + 1,
         last_attempt_at = ?,
         last_error = ?
     WHERE id = ?`,
    [nowISOString(), error ?? null, id]
  );
}

export async function deletePendingUpload(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM pending_uploads WHERE id = ?', [id]);
}

export async function removePendingFeaturedCandidate(entryId: string): Promise<void> {
  const db = await getDb();
  const uploads = await db.getAllAsync<PendingUpload>(
    `SELECT * FROM pending_uploads WHERE type = 'featured_candidate'`
  );

  for (const upload of uploads) {
    try {
      const payload = JSON.parse(upload.payload) as { entry_id?: string };
      if (payload.entry_id === entryId) {
        await db.runAsync('DELETE FROM pending_uploads WHERE id = ?', [upload.id]);
      }
    } catch {
      // Malformed queue items are left for the normal retry/error path.
    }
  }
}

// entry_date が昨日以前の featured_candidate キューを削除
export async function cleanExpiredFeaturedCandidates(): Promise<void> {
  const db = await getDb();
  const yesterday = getYesterdayJST();
  const uploads = await db.getAllAsync<PendingUpload>(
    `SELECT * FROM pending_uploads WHERE type = 'featured_candidate'`
  );
  for (const u of uploads) {
    try {
      const payload = JSON.parse(u.payload) as { entry_date?: string };
      if (payload.entry_date && payload.entry_date <= yesterday) {
        await db.runAsync('DELETE FROM pending_uploads WHERE id = ?', [u.id]);
      }
    } catch {
      // JSON parse 失敗は無視
    }
  }
}
