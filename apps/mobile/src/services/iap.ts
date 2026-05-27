import {
  initConnection,
  endConnection,
  fetchProducts as iapFetchProducts,
  requestPurchase,
  getAvailablePurchases,
  restorePurchases as iapRestorePurchases,
  finishTransaction,
  type ProductOrSubscription,
  type Purchase,
  type PurchaseIOS,
} from 'expo-iap';
import {
  getProState,
  setProPurchased,
  clearPro,
  updateProState,
} from '@/db/proState';
import { useAuthStore } from '@/store/authStore';
import { nowISOString, isExpired, daysDiff } from '@/utils/date';

export const IAP_PRODUCTS = {
  LIFETIME: 'com.mainichipet.app.pro_lifetime',
  MONTHLY:  'com.mainichipet.app.pro_monthly',
} as const;

export async function initIAP(): Promise<void> {
  await initConnection();
}

export async function closeIAP(): Promise<void> {
  await endConnection();
}

export async function fetchProducts(): Promise<ProductOrSubscription[]> {
  const result = await iapFetchProducts({ skus: [IAP_PRODUCTS.LIFETIME, IAP_PRODUCTS.MONTHLY], type: 'all' });
  return result ?? [];
}

export async function purchasePro(productId: string): Promise<void> {
  const isMonthly = productId === IAP_PRODUCTS.MONTHLY;

  const result = await requestPurchase({
    request: { apple: { sku: productId } },
    type: isMonthly ? 'subs' : 'in-app',
  });

  const purchase: Purchase | null = Array.isArray(result) ? (result[0] ?? null) : result;
  if (!purchase) throw new Error('Purchase returned null');

  await finishTransaction({ purchase, isConsumable: false });

  const expiresAt = isMonthly
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const purchaseIOS = purchase as PurchaseIOS;

  await setProPurchased(
    isMonthly ? 'monthly' : 'lifetime',
    productId,
    purchaseIOS.originalTransactionIdentifierIOS ?? purchaseIOS.transactionId ?? '',
    expiresAt,
    null
  );

  useAuthStore.getState().setIsPro(true);
}

export async function restorePurchases(): Promise<boolean> {
  await iapRestorePurchases();
  const history = await getAvailablePurchases();
  const validPurchase = history.find(
    p => p.productId === IAP_PRODUCTS.LIFETIME || p.productId === IAP_PRODUCTS.MONTHLY
  );
  if (!validPurchase) return false;

  const isMonthly = validPurchase.productId === IAP_PRODUCTS.MONTHLY;
  const validPurchaseIOS = validPurchase as PurchaseIOS;
  await setProPurchased(
    isMonthly ? 'monthly' : 'lifetime',
    validPurchase.productId,
    validPurchaseIOS.originalTransactionIdentifierIOS ?? validPurchaseIOS.transactionId ?? '',
    null,
    null
  );
  await finishTransaction({ purchase: validPurchase, isConsumable: false });
  useAuthStore.getState().setIsPro(true);
  return true;
}

export async function verifyProState(): Promise<void> {
  const state = await getProState();
  if (!state.purchased) return;

  if (state.plan === 'monthly' && state.expires_at && isExpired(state.expires_at)) {
    await clearPro();
    useAuthStore.getState().setIsPro(false);
    return;
  }

  if (state.last_verified_at) {
    const diffDays = daysDiff(state.last_verified_at, nowISOString());
    if (diffDays > 7) {
      useAuthStore.getState().setIsPro(false);
      return;
    }
  }

  await updateProState({ last_verified_at: nowISOString() });
  useAuthStore.getState().setIsPro(true);
}
