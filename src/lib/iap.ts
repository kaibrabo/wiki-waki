// Waimea Pro — purchase config and entitlement logic (StoreKit 2, on-device).
//
// One Pro entitlement per Apple ID that spans ALL the user's devices (Apple ties
// purchases to the account, not the device). Monetization ships OFF in v1.0 (free
// launch) and is switched on in v1.1 by flipping MONETIZATION_ENABLED and the
// remote `offer` flag.

import * as IAP from '../../modules/moondial-iap';
import { useStore } from '../store';

/** Master switch. Keep false for the free 1.0 launch; enable in v1.1. */
export const MONETIZATION_ENABLED = false;

/** App Store product identifiers (create these in App Store Connect). */
export const PRODUCT_IDS = {
  lifetime: 'com.kaibrabo.moondial.pro.lifetime', // non-consumable
  yearly: 'com.kaibrabo.moondial.pro.yearly', // auto-renewable
  monthly: 'com.kaibrabo.moondial.pro.monthly', // auto-renewable
} as const;

const PRO_IDS = new Set<string>(Object.values(PRODUCT_IDS));

/** Which paywall to show, controlled remotely so it can switch without a release. */
export type Offer = 'lifetime' | 'sub' | 'off';
const OFFER_CONFIG_URL = 'https://kainoabrabo.com/waimea/config.json';

/** Pro if the user owns the lifetime unlock OR has an active subscription. */
export function isProFromEntitlements(ids: string[]): boolean {
  return ids.some((id) => PRO_IDS.has(id));
}

/** Re-check StoreKit entitlements and update the store's `isPro`. */
export async function refreshPro(): Promise<boolean> {
  if (!IAP.isAvailable) return false;
  const ids = await IAP.currentEntitlements();
  const pro = isProFromEntitlements(ids);
  useStore.getState().setPro(pro);
  return pro;
}

/**
 * Wire up purchases: refresh entitlement on launch and subscribe to out-of-band
 * changes (renewals, refunds, Ask to Buy). Safe no-op when the native module is
 * absent. NOT wired into the app for v1.0 — call from App on mount in v1.1.
 */
export function initPurchases(): () => void {
  void refreshPro();
  const sub = IAP.addEntitlementsListener((ids) => {
    useStore.getState().setPro(isProFromEntitlements(ids));
  });
  return () => sub?.remove();
}

/** Fetch the current paywall offer from the remote flag; defaults to 'off'. */
export async function fetchOffer(): Promise<Offer> {
  try {
    const res = await fetch(OFFER_CONFIG_URL, { cache: 'no-store' as RequestCache });
    const json = await res.json();
    if (json?.offer === 'lifetime' || json?.offer === 'sub' || json?.offer === 'off') {
      return json.offer;
    }
  } catch {
    // Network/parse failure — leave the paywall off rather than nag.
  }
  return 'off';
}

export { IAP };
