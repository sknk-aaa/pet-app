import type { SQLiteDatabase } from 'expo-sqlite';

export async function migration002(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entries_new (
      id                       TEXT PRIMARY KEY,
      date                     TEXT NOT NULL,
      primary_pet_id           TEXT REFERENCES pets(id),
      title                    TEXT NOT NULL,
      memo                     TEXT,
      image_uri                TEXT NOT NULL,
      thumbnail_uri            TEXT NOT NULL,
      anniversary_tag_type     TEXT,
      anniversary_tag_name     TEXT,
      featured_submitted       INTEGER NOT NULL DEFAULT 0,
      featured_candidate_id    TEXT,
      featured_status_cache    TEXT,
      created_at               TEXT NOT NULL,
      updated_at               TEXT NOT NULL,
      UNIQUE(date, primary_pet_id)
    );

    INSERT INTO entries_new(
      id, date, primary_pet_id, title, memo, image_uri, thumbnail_uri,
      anniversary_tag_type, anniversary_tag_name,
      featured_submitted, featured_candidate_id, featured_status_cache,
      created_at, updated_at
    )
    SELECT
      e.id, e.date,
      (SELECT ep.pet_id FROM entry_pets ep WHERE ep.entry_id = e.id ORDER BY ep.created_at ASC LIMIT 1),
      e.title, e.memo, e.image_uri, e.thumbnail_uri,
      e.anniversary_tag_type, e.anniversary_tag_name,
      e.featured_submitted, e.featured_candidate_id, e.featured_status_cache,
      e.created_at, e.updated_at
    FROM entries e;

    DROP TABLE entries;
    ALTER TABLE entries_new RENAME TO entries;

    CREATE INDEX IF NOT EXISTS idx_entries_date           ON entries(date);
    CREATE INDEX IF NOT EXISTS idx_entries_primary_pet_id ON entries(primary_pet_id);
    CREATE INDEX IF NOT EXISTS idx_entries_anniversary_tag_type ON entries(anniversary_tag_type);
  `);
}
