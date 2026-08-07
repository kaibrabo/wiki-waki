import { XStack } from 'tamagui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffectiveTheme } from '../hooks/useEffectiveTheme';

export function SettingsButton({ onPress }: { onPress: () => void }) {
  const theme = useEffectiveTheme();
  const iconColor = theme === 'dark' ? '#aaa' : '#666';

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
      onPress={onPress}
      aria-label="Settings"
    >
      <MaterialCommunityIcons name="cog" size={22} color={iconColor} />
    </XStack>
  );
}
