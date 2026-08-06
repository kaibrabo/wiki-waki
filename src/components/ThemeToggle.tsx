import { XStack, Text } from 'tamagui';
import { useStore, type ThemePref } from '../store';

// Cycles system → light → dark → system. The glyph shows the current preference.
const NEXT: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };
const GLYPH: Record<ThemePref, string> = { system: '🖥', light: '☀️', dark: '🌙' };

export function ThemeToggle() {
  const pref = useStore((s) => s.themePref);
  const setThemePref = useStore((s) => s.setThemePref);
  return (
    <XStack
      width={38}
      height={38}
      rounded={999}
      items="center"
      justify="center"
      bg="$color3"
      pressStyle={{ bg: '$color5' }}
      cursor="pointer"
      onPress={() => setThemePref(NEXT[pref])}
      aria-label={`Theme: ${pref}`}
    >
      <Text fontSize={17} lineHeight={20}>
        {GLYPH[pref]}
      </Text>
    </XStack>
  );
}
