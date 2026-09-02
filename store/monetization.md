# Waimea Monetization — StoreKit 2 layer

Status: **built, dormant, staged for v1.1.** v1.0 ships free. None of this is in the
1.0 binary until you run `pod install` (autolinking picks up `modules/moondial-iap`).

## Model
- One **Pro** entitlement per Apple ID that works on ALL the user's devices (Apple ties
  purchases to the account, not the device — you cannot charge per device).
- Plan: **founder Lifetime now → subscription later.** Lifetime buyers are grandfathered
  forever (a non-consumable purchase persists; you just stop offering it).
- `isPro` is true if the user owns the lifetime unlock OR has an active subscription.

## Pieces
- `modules/moondial-iap/` — StoreKit 2 native module (getProducts, purchase, restore,
  currentEntitlements, entitlement-change events). No backend.
- `src/lib/iap.ts` — product IDs, `MONETIZATION_ENABLED` flag, `refreshPro`, `initPurchases`,
  `fetchOffer` (remote paywall switch).
- `src/hooks/useIsPro.ts` — gate features with `const isPro = useIsPro();`.
- `src/components/Paywall.tsx` — paywall UI (lifetime + subscription states, restore,
  Terms/Privacy links, "Works on all your devices").
- `src/store.ts` — `isPro` state (not persisted; StoreKit is the source of truth).
- `ios/Waimea.storekit` — StoreKit test config for the simulator (attach it to the Run
  scheme: Scheme ▸ Run ▸ Options ▸ StoreKit Configuration).
- `kainoabrabo.com/waimea/config.json` — remote flag: `{"offer": "off" | "lifetime" | "sub"}`.

## Product IDs (create in App Store Connect)
- `com.kaibrabo.moondial.pro.lifetime` — Non-Consumable ($9.99 founder)
- `com.kaibrabo.moondial.pro.yearly` — Auto-Renewable ($7.99/yr, 7-day trial)
- `com.kaibrabo.moondial.pro.monthly` — Auto-Renewable ($1.49/mo)

## To turn it on for v1.1
1. In App Store Connect, create the three IAP products above and submit them with the build.
2. `cd ios && pod install` (activates the native module), then rebuild.
3. Set `MONETIZATION_ENABLED = true` in `src/lib/iap.ts`.
4. Call `initPurchases()` on app mount, and gate Pro features with `useIsPro()`
   (suggested free/Pro split: free = 3 cities + small widget + core sound; Pro = unlimited
   cities, all sounds, all widgets + complications, themes/formats).
5. Show `<Paywall>` when a gated action is attempted; drive `offer` from `fetchOffer()`.
6. Flip `config.json` to `"lifetime"` to open the founder window; later `"sub"` to switch
   new users to subscriptions. Lifetime owners keep Pro either way.
