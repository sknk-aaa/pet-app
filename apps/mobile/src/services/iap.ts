import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  requestSubscription,
  getPurchaseHistory,
  finishTransaction,
  type Product,
  type Purchase,
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

export async function fetchProducts(): Promise<Product[]> {
  return getProducts([IAP_PRODUCTS.LIFETIME, IAP_PRODUCTS.MONTHLY]);
}

export async function purchasePro(productId: string): Promise<void> {
  let purchase: Purchase;

  if (productId === IAP_PRODUCTS.MONTHLY) {
    const result = await requestSubscription(productId);
    if (!result) throw new Error('Subscription purchase returned null');
    purchase = result;
  } else {
    purchase = await requestPurchase(productId);
  }

  await finishTransaction(purchase, false);

  const isMonthly = productId === IAP_PRODUCTS.MONTHLY;
  const expiresAt = isMonthly
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  await setProPurchased(
    isMonthly ? 'monthly' : 'lifetime',
    productId,
    purchase.originalTransactionIdentifierIOS ?? purchase.transactionId ?? '',
    expiresAt,
    null
  );

  useAuthStore.getState().setIsPro(true);
}

export async function restorePurchases(): Promise<boolean> {
  const history = await getPurchaseHistory();
  const validPurchase = history.find(
    p => p.productId === IAP_PRODUCTS.LIFETIME || p.productId === IAP_PRODUCTS.MONTHLY
  );
  if (!validPurchase) return false;

  const isMonthly = validPurchase.productId === IAP_PRODUCTS.MONTHLY;
  await setProPurchased(
    isMonthly ? 'monthly' : 'lifetime',
    validPurchase.productId,
    validPurchase.originalTransactionIdentifierIOS ?? validPurchase.transactionId ?? '',
    null,
    null
  );
  await finishTransaction(validPurchase, false);
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
