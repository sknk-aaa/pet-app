import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
  type CustomerInfo,
} from 'react-native-purchases';
import { useAuthStore } from '@/store/authStore';

const RC_API_KEY_IOS = 'appl_lHwPpELBjlJuOpgASVhEKVliBOc';
const PRO_ENTITLEMENT = 'pro';

export const IAP_PRODUCTS = {
  LIFETIME: 'com.mainichipet.app.pro_lifetime',
  MONTHLY:  'com.mainichipet.app.pro_monthly',
} as const;

export function configureRevenueCat(userId?: string): void {
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: RC_API_KEY_IOS, appUserID: userId ?? null });
}

export async function loginRevenueCat(userId: string): Promise<void> {
  await Purchases.logIn(userId);
}

export async function logoutRevenueCat(): Promise<void> {
  await Purchases.logOut();
}

export async function getOfferings() {
  return Purchases.getOfferings();
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const isPro = isProFromCustomerInfo(customerInfo);
  useAuthStore.getState().setIsPro(isPro);
  return isPro;
}

export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  const isPro = isProFromCustomerInfo(customerInfo);
  useAuthStore.getState().setIsPro(isPro);
  return isPro;
}

export function isProFromCustomerInfo(customerInfo: CustomerInfo): boolean {
  return !!customerInfo.entitlements.active[PRO_ENTITLEMENT];
}

export async function verifyProState(): Promise<void> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    useAuthStore.getState().setIsPro(isProFromCustomerInfo(customerInfo));
  } catch {
    // ネットワークエラーは無視し前回の状態を維持
  }
}
