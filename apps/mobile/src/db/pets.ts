import * as FileSystem from 'expo-file-system';
import { getDb } from '@/db/client';
import { generateUUID } from '@/utils/uuid';
import { nowISOString } from '@/utils/date';
import type { Pet, CreatePetInput, UpdatePetInput } from '@/types';

export async function getAllPets(): Promise<Pet[]> {
  const db = await getDb();
  return db.getAllAsync<Pet>(
    'SELECT * FROM pets ORDER BY sort_order ASC, created_at ASC'
  );
}

export async function getPetById(id: string): Promise<Pet | null> {
  const db = await getDb();
  return db.getFirstAsync<Pet>('SELECT * FROM pets WHERE id = ?', [id]);
}

export async function createPet(data: CreatePetInput): Promise<Pet> {
  const db = await getDb();
  const now = nowISOString();
  const id = generateUUID();

  // 既存ペット数を取得して sort_order を設定
  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM pets'
  );
  const sortOrder = data.sort_order ?? (countRow?.count ?? 0);

  await db.runAsync(
    `INSERT INTO pets(id, name, species, species_other, birthday, gender, icon_uri, sort_order, created_at, updated_at)
     VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.species,
      data.species_other ?? null,
      data.birthday ?? null,
      data.gender ?? null,
      data.icon_uri ?? null,
      sortOrder,
      now,
      now,
    ]
  );

  return (await getPetById(id))!;
}

export async function updatePet(id: string, data: UpdatePetInput): Promise<void> {
  const db = await getDb();
  const now = nowISOString();
  const fields = Object.entries({ ...data, updated_at: now })
    .map(([k]) => `${k} = ?`)
    .join(', ');
  const values = [...Object.values({ ...data, updated_at: now }), id];

  await db.runAsync(`UPDATE pets SET ${fields} WHERE id = ?`, values);
}

export async function deletePet(id: string): Promise<void> {
  const db = await getDb();

  // アイコンファイルを削除
  const pet = await getPetById(id);
  if (pet?.icon_uri) {
    await FileSystem.deleteAsync(pet.icon_uri, { idempotent: true });
  }

  await db.runAsync('DELETE FROM pets WHERE id = ?', [id]);
}

export async function getPetCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM pets'
  );
  return row?.count ?? 0;
}
