import type { SQLiteDatabase } from 'expo-sqlite';

export async function migration001(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pets (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      species         TEXT NOT NULL,
      species_other   TEXT,
      birthday        TEXT,
      gender          TEXT,
      icon_uri        TEXT,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entries (
      id                       TEXT PRIMARY KEY,
      date                     TEXT NOT NULL UNIQUE,
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
      updated_at               TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entry_pets (
      id          TEXT PRIMARY KEY,
      entry_id    TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      pet_id      TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      created_at  TEXT NOT NULL,
      UNIQUE(entry_id, pet_id)
    );

    CREATE TABLE IF NOT EXISTS streak_state (
      id                       INTEGER PRIMARY KEY CHECK (id = 1),
      display_streak           INTEGER NOT NULL DEFAULT 0,
      featured_weight_streak   INTEGER NOT NULL DEFAULT 0,
      last_entry_date          TEXT,
      updated_at               TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key    TEXT PRIMARY KEY,
      value  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pro_state (
      id                      INTEGER PRIMARY KEY CHECK (id = 1),
      purchased               INTEGER NOT NULL DEFAULT 0,
      plan                    TEXT,
      product_id              TEXT,
      original_transaction_id TEXT,
      purchased_at            TEXT,
      expires_at              TEXT,
      last_verified_at        TEXT,
      receipt_data            TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_uploads (
      id              TEXT PRIMARY KEY,
      type            TEXT NOT NULL,
      payload         TEXT NOT NULL,
      attempt_count   INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TEXT,
      last_error      TEXT,
      created_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schema_version (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_entries_date
      ON entries(date);

    CREATE INDEX IF NOT EXISTS idx_entries_anniversary_tag_type
      ON entries(anniversary_tag_type);

    CREATE INDEX IF NOT EXISTS idx_entry_pets_entry_id
      ON entry_pets(entry_id);

    CREATE INDEX IF NOT EXISTS idx_entry_pets_pet_id
      ON entry_pets(pet_id);
  `);
}
