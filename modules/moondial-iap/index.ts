// JS interface for the MoondialIap native module (StoreKit 2, iOS only).
//
// On Android/web `requireOptionalNativeModule` returns null, so every call is a
// safe no-op. Entitlements are validated on-device by StoreKit against the user's
// Apple ID, so one Pro purchase works across all their devices.

import { requireOptionalNativeModule } from 'expo';

/** A native event subscription with a remove() method. */
export type IapSubscription = { remove: () => void };

export type IapProductType = 'lifetime' | 'subscription' | 'other';

export interface IapProduct {
  id: string;
  displayName: string;
  description: string;
  displayPrice: string; // localized, e.g. "$9.99"
  price: number;
  type: IapProductType;
}

export type PurchaseResult = 'purchased' | 'pending' | 'cancelled' | 'unverified' | 'unknown';

type NativeIap = {
  getProducts: (ids: string[]) => Promise<IapProduct[]>;
  purchase: (id: string) => Promise<PurchaseResult>;
  restore: () => Promise<string[]>;
  currentEntitlements: () => Promise<string[]>;
  addListener: (
    event: 'onEntitlementsChange',
    listener: (payload: { productIds: string[] }) => void,
  ) => IapSubscription;
};

const MoondialIap = requireOptionalNativeModule<NativeIap>('MoondialIap');

/** True when the native StoreKit module is present (iOS build). */
export const isAvailable = MoondialIap != null;

/** Fetch localized product metadata for the given product ids. */
export async function getProducts(ids: string[]): Promise<IapProduct[]> {
  if (!MoondialIap) return [];
  return MoondialIap.getProducts(ids);
}

/** Start a purchase; resolves with the outcome. */
export async function purchase(id: string): Promise<PurchaseResult> {
  if (!MoondialIap) return 'unknown';
  return MoondialIap.purchase(id);
}

/** Restore purchases across the user's devices; resolves with entitled ids. */
export async function restore(): Promise<string[]> {
  if (!MoondialIap) return [];
  return MoondialIap.restore();
}

/** Product ids the user is currently entitled to (owned lifetime + active subs). */
export async function currentEntitlements(): Promise<string[]> {
  if (!MoondialIap) return [];
  return MoondialIap.currentEntitlements();
}

/** Subscribe to out-of-band entitlement changes (renewals, refunds, Ask to Buy). */
export function addEntitlementsListener(
  listener: (productIds: string[]) => void,
): IapSubscription | null {
  if (!MoondialIap) return null;
  return MoondialIap.addListener('onEntitlementsChange', ({ productIds }) => listener(productIds));
}
