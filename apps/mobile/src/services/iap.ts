import {
  initConnection,
  endConnection,
  fetchProducts as iapFetchProducts,
  requestPurchase,
  restorePurchases as iapRestorePurchases,
  finishTransaction,
  type Product,
  type SubscriptionProduct,
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

export async function fetchProducts(): Promise<(Product | SubscriptionProduct)[]> {
  const [inapp, subs] = await Promise.all([
    iapFetchProducts({ skus: [IAP_PRODUCTS.LIFETIME], type: 'inapp' }),
    iapFetchProducts({ skus: [IAP_PRODUCTS.MONTHLY], type: 'subs' }),
  ]);
  return [...(inapp ?? []), ...(subs ?? [])];
}

export async function purchasePro(productId: string): Promise<void> {
  const isMonthly = productId === IAP_PRODUCTS.MONTHLY;

  const result = await requestPurchase(
    isMonthly
      ? { request: { ios: { sku: productId } }, type: 'subs' as const }
      : { request: { ios: { sku: productId } }, type: 'inapp' as const }
  );

  const purchase = result == null ? null : (Array.isArray(result) ? (result[0] ?? null) : result);
  if (!purchase) throw new Error('Purchase returned null');

  await finishTransaction({ purchase, isConsumable: false });

  const purchaseIOS = purchase as PurchaseIOS;
  const expiresAt = isMonthly
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

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
  const history = await iapRestorePurchases();
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
