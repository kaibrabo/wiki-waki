import { Modal } from 'react-native';
import { YStack, XStack, Text, Button, Card, Switch } from 'tamagui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useEffectiveTheme } from '../hooks/useEffectiveTheme';

export function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const themePref = useStore((s) => s.themePref);
  const setThemePref = useStore((s) => s.setThemePref);
  const use24Hour = useStore((s) => s.use24Hour);
  const setUse24Hour = useStore((s) => s.setUse24Hour);
  const theme = useEffectiveTheme();

  const isDark = themePref === 'dark' || (themePref === 'system' && theme === 'dark');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <YStack flex={1} bg="rgba(0,0,0,0.5)" justify="flex-end">
        <YStack bg="$background" borderTopLeftRadius={24} borderTopRightRadius={24} pt="$3" pb="$6">
          <XStack items="center" justify="space-between" px="$4" pb="$3" borderBottomWidth={1} borderColor="$borderColor">
            <Text fontSize={20} fontWeight="700" color="$color12">
              Settings
            </Text>
            <Button size="$3" chromeless onPress={onClose}>
              <Text color="$blue10" fontSize={17} fontWeight="600">
                Done
              </Text>
            </Button>
          </XStack>

          <YStack px="$4" pt="$4" gap="$4">
            {/* Theme Toggle */}
            <Card bg="$color2" borderWidth={1} borderColor="$borderColor" rounded="$4" px="$4" py="$3.5">
              <XStack items="center" justify="space-between">
                <XStack items="center" gap="$3">
                  <MaterialCommunityIcons
                    name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
                    size={22}
                    color={isDark ? '#aaa' : '#f59e0b'}
                  />
                  <Text fontSize={16} color="$color12">
                    Dark Mode
                  </Text>
                </XStack>
                <Switch
                  size="$3"
                  checked={isDark}
                  onCheckedChange={(checked) => setThemePref(checked ? 'dark' : 'light')}
                  backgroundColor={isDark ? '$blue9' : '$color5'}
                >
                  <Switch.Thumb backgroundColor="white" />
                </Switch>
              </XStack>
            </Card>

            {/* 24-Hour Toggle */}
            <Card bg="$color2" borderWidth={1} borderColor="$borderColor" rounded="$4" px="$4" py="$3.5">
              <XStack items="center" justify="space-between">
                <XStack items="center" gap="$3">
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={22}
                    color="#888"
                  />
                  <Text fontSize={16} color="$color12">
                    24-Hour Time
                  </Text>
                </XStack>
                <Switch
                  size="$3"
                  checked={use24Hour}
                  onCheckedChange={setUse24Hour}
                  backgroundColor={use24Hour ? '$blue9' : '$color5'}
                >
                  <Switch.Thumb backgroundColor="white" />
                </Switch>
              </XStack>
            </Card>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
