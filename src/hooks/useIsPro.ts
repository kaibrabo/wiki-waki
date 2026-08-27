import { useStore } from '../store';
import { MONETIZATION_ENABLED } from '../lib/iap';

/**
 * Whether the user has KTMPO Pro. While monetization is disabled (v1.0 free
 * launch) this is always true, so gating is inert until v1.1 flips the flag.
 * Gate a Pro feature with: `const isPro = useIsPro();`
 */
export function useIsPro(): boolean {
  const isPro = useStore((s) => s.isPro);
  return !MONETIZATION_ENABLED || isPro;
}
