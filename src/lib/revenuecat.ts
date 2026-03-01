import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  type PurchasesOffering,
  type PurchasesPackage,
  type CustomerInfo,
} from "@revenuecat/purchases-capacitor";

const IOS_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY as string;

export async function initRevenueCat(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!IOS_KEY) {
    console.warn("VITE_REVENUECAT_IOS_KEY is not set — RevenueCat disabled");
    return;
  }
  await Purchases.configure({ apiKey: IOS_KEY, appUserID: userId });
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const { offerings } = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}

export function hasPro(customerInfo: CustomerInfo): boolean {
  return !!customerInfo.entitlements.active["pro"];
}
