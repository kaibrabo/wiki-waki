import { XStack } from 'tamagui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore, type ThemePref } from '../store';
import { useEffectiveTheme } from '../hooks/useEffectiveTheme';

// Toggles between light and dark only
const ICON: Record<'light' | 'dark', keyof typeof MaterialCommunityIcons.glyphMap> = {
  light: 'white-balance-sunny',
  dark: 'moon-waning-crescent',
};

export function ThemeToggle() {
  const pref = useStore((s) => s.themePref);
  const setThemePref = useStore((s) => s.setThemePref);
  const theme = useEffectiveTheme();
  const iconColor = theme === 'dark' ? '#aaa' : '#666';

  // Treat 'system' as 'light' for display, toggle between light/dark only
  const current = pref === 'system' ? 'light' : pref;
  const next: ThemePref = current === 'light' ? 'dark' : 'light';

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
      onPress={() => setThemePref(next)}
      aria-label={`Theme: ${current}`}
    >
      <MaterialCommunityIcons name={ICON[current]} size={20} color={iconColor} />
    </XStack>
  );
}
