import { useColorScheme } from 'react-native';
import { useStore } from '../store';

/** Resolve the user's theme preference (light/dark/system) to a concrete theme. */
export function useEffectiveTheme(): 'light' | 'dark' {
  const pref = useStore((s) => s.themePref);
  const system = useColorScheme();
  if (pref === 'system') return system === 'dark' ? 'dark' : 'light';
  return pref;
}
