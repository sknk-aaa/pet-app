import { getDb } from '@/db/client';
import { getTodayJST, getYesterdayJST, nowISOString } from '@/utils/date';
import { getSetting, setSetting } from '@/db/settings';
import type { StreakState } from '@/types';

export async function getStreakState(): Promise<StreakState> {
  const db = await getDb();
  const row = await db.getFirstAsync<StreakState>(
    'SELECT * FROM streak_state WHERE id = 1'
  );
  return row ?? {
    id: 1,
    display_streak: 0,
    featured_weight_streak: 0,
    last_entry_date: null,
    updated_at: nowISOString(),
  };
}

export async function initStreakState(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO streak_state(id, display_streak, featured_weight_streak, last_entry_date, updated_at)
     VALUES(1, 0, 0, NULL, ?)`,
    [nowISOString()]
  );
}

// docs/05 §1 に従ったストリーク更新
export async function updateStreakOnSave(db: import('expo-sqlite').SQLiteDatabase, todayDate: string, existingEntry: boolean): Promise<void> {
  if (existingEntry) return; // 当日の編集は streak を変えない

  const state = await db.getFirstAsync<StreakState>('SELECT * FROM streak_state WHERE id = 1');
  const current = state ?? {
    display_streak: 0,
    featured_weight_streak: 0,
    last_entry_date: null,
  };

  const yesterday = getYesterdayJST();
  let displayStreak: number;
  let featuredWeightStreak: number;

  if (current.last_entry_date === yesterday) {
    displayStreak = current.display_streak + 1;
    featuredWeightStreak = current.featured_weight_streak + 1;
  } else {
    displayStreak = 1;
    featuredWeightStreak = 1;
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO streak_state(id, display_streak, featured_weight_streak, last_entry_date, updated_at)
     VALUES(1, ?, ?, ?, ?)`,
    [displayStreak, featuredWeightStreak, todayDate, nowISOString()]
  );
}

// 「今日のペット」に選ばれた時: featured_weight_streak を 0 に
export async function resetFeaturedWeightStreak(featuredDate: string): Promise<void> {
  const lastSync = await getSetting('last_streak_sync_date');
  if (lastSync === featuredDate) return; // 同日分の重複リセット防止

  const db = await getDb();
  await db.runAsync(
    `UPDATE streak_state SET featured_weight_streak = 0, updated_at = ? WHERE id = 1`,
    [nowISOString()]
  );
  await setSetting('last_streak_sync_date', featuredDate);
}
