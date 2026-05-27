import { getDb } from '@/db/client';
import { nowISOString } from '@/utils/date';
import type { ProState } from '@/types';

export async function getProState(): Promise<ProState> {
  const db = await getDb();
  const row = await db.getFirstAsync<ProState>(
    'SELECT * FROM pro_state WHERE id = 1'
  );
  return row ?? {
    id: 1,
    purchased: 0,
    plan: null,
    product_id: null,
    original_transaction_id: null,
    purchased_at: null,
    expires_at: null,
    last_verified_at: null,
    receipt_data: null,
  };
}

export async function initProState(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO pro_state(id, purchased) VALUES(1, 0)`
  );
}

export async function updateProState(data: Partial<Omit<ProState, 'id'>>): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), 1];
  await db.runAsync(`UPDATE pro_state SET ${fields} WHERE id = ?`, values);
}

export async function setProPurchased(
  plan: 'lifetime' | 'monthly',
  productId: string,
  originalTransactionId: string,
  expiresAt: string | null,
  receiptData: string | null,
): Promise<void> {
  await updateProState({
    purchased: 1,
    plan,
    product_id: productId,
    original_transaction_id: originalTransactionId,
    purchased_at: nowISOString(),
    expires_at: expiresAt,
    last_verified_at: nowISOString(),
    receipt_data: receiptData,
  });
}

export async function clearPro(): Promise<void> {
  await updateProState({ purchased: 0, plan: null, expires_at: null });
}
