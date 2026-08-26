import { useState } from 'react';
import { Modal, ScrollView } from 'react-native';
import { YStack, XStack, Text, Button, Card, Switch } from 'tamagui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useEffectiveTheme } from '../hooks/useEffectiveTheme';
import { LANGUAGE_OPTIONS, getTranslations } from '../lib/i18n';
import type { Language } from '../lib/i18n';

export function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const themePref = useStore((s) => s.themePref);
  const setThemePref = useStore((s) => s.setThemePref);
  const use24Hour = useStore((s) => s.use24Hour);
  const setUse24Hour = useStore((s) => s.setUse24Hour);
  const dateFormat = useStore((s) => s.dateFormat);
  const setDateFormat = useStore((s) => s.setDateFormat);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const theme = useEffectiveTheme();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const isDark = themePref === 'dark' || (themePref === 'system' && theme === 'dark');
  const t = getTranslations(language);
  const currentLangOption = LANGUAGE_OPTIONS.find((l) => l.value === language);

  if (showLanguagePicker) {
    return (
      <Modal 
        visible={visible} 
        animationType="slide" 
        transparent 
        onRequestClose={() => setShowLanguagePicker(false)}
        accessibilityViewIsModal={true}
      >
        <YStack flex={1} bg="rgba(0,0,0,0.5)" justify="flex-end">
          <YStack bg="$background" borderTopLeftRadius={24} borderTopRightRadius={24} pt="$3" pb="$6" height="70%">
            <XStack items="center" justify="space-between" px="$4" pb="$3" borderBottomWidth={1} borderColor="$borderColor">
              <Text fontSize={20} fontWeight="700" color="$color12" accessibilityRole="header">
                {t.language}
              </Text>
              <Button 
                size="$3" 
                chromeless 
                onPress={() => setShowLanguagePicker(false)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t.done}
              >
                <Text color="$blue10" fontSize={17} fontWeight="600">
                  {t.done}
                </Text>
              </Button>
            </XStack>
            <ScrollView>
              <YStack px="$4" pt="$3" gap="$2" accessibilityRole="radiogroup">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <Card
                    key={opt.value}
                    bg={language === opt.value ? '$blue3' : '$color2'}
                    borderWidth={1}
                    borderColor={language === opt.value ? '$blue8' : '$borderColor'}
                    rounded="$4"
                    px="$4"
                    py="$3.5"
                    pressStyle={{ bg: '$color3' }}
                    onPress={() => {
                      setLanguage(opt.value as Language);
                      setShowLanguagePicker(false);
                    }}
                    accessible={true}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: language === opt.value }}
                    accessibilityLabel={`${opt.nativeLabel}, ${opt.label}`}
                  >
                    <XStack items="center" justify="space-between">
                      <YStack>
                        <Text fontSize={16} color="$color12" fontWeight={language === opt.value ? '600' : '400'}>
                          {opt.nativeLabel}
                        </Text>
                        <Text fontSize={13} color="$color10">
                          {opt.label}
                        </Text>
                      </YStack>
                      {language === opt.value && (
                      <MaterialCommunityIcons name="check" size={22} color="#3b82f6" accessibilityElementsHidden />
                    )}
                  </XStack>
                </Card>
              ))}
            </YStack>
          </ScrollView>
        </YStack>
      </YStack>
    </Modal>
  );
}

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent 
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <YStack flex={1} bg="rgba(0,0,0,0.5)" justify="flex-end">
        <YStack bg="$background" borderTopLeftRadius={24} borderTopRightRadius={24} pt="$3" pb="$6">
          <XStack items="center" justify="space-between" px="$4" pb="$3" borderBottomWidth={1} borderColor="$borderColor">
            <Text fontSize={20} fontWeight="700" color="$color12" accessibilityRole="header">
              {t.settings}
            </Text>
            <Button 
              size="$3" 
              chromeless 
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t.done}
            >
              <Text color="$blue10" fontSize={17} fontWeight="600">
                {t.done}
              </Text>
            </Button>
          </XStack>

          <YStack px="$4" pt="$4" gap="$4">
            {/* Theme Toggle */}
            <Card 
              bg="$color2" 
              borderWidth={1} 
              borderColor="$borderColor" 
              rounded="$4" 
              px="$4" 
              py="$3.5"
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel={t.darkMode}
              accessibilityState={{ checked: isDark }}
            >
              <XStack items="center" justify="space-between">
                <XStack items="center" gap="$3">
                  <MaterialCommunityIcons
                    name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
                    size={22}
                    color={isDark ? '#aaa' : '#f59e0b'}
                  />
                  <Text fontSize={16} color="$color12">
                    {t.darkMode}
                  </Text>
                </XStack>
                <Switch
                  size="$3"
                  checked={isDark}
                  onCheckedChange={(checked) => setThemePref(checked ? 'dark' : 'light')}
                  backgroundColor={isDark ? '$blue9' : '$color5'}
                  accessibilityElementsHidden
                >
                  <Switch.Thumb backgroundColor="white" />
                </Switch>
              </XStack>
            </Card>

            {/* 24-Hour Toggle */}
            <Card 
              bg="$color2" 
              borderWidth={1} 
              borderColor="$borderColor" 
              rounded="$4" 
              px="$4" 
              py="$3.5"
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel={t.time24Hour}
              accessibilityState={{ checked: use24Hour }}
            >
              <XStack items="center" justify="space-between">
                <XStack items="center" gap="$3">
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={22}
                    color="#888"
                  />
                  <Text fontSize={16} color="$color12">
                    {t.time24Hour}
                  </Text>
                </XStack>
                <Switch
                  size="$3"
                  checked={use24Hour}
                  onCheckedChange={setUse24Hour}
                  backgroundColor={use24Hour ? '$blue9' : '$color5'}
                  accessibilityElementsHidden
                >
                  <Switch.Thumb backgroundColor="white" />
                </Switch>
              </XStack>
            </Card>

            {/* Date Format */}
            <Card
              bg="$color2"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
              px="$4"
              py="$3.5"
            >
              <XStack items="center" justify="space-between" gap="$2">
                <XStack items="center" gap="$3" shrink={1}>
                  <MaterialCommunityIcons name="calendar" size={22} color="#888" />
                  <Text fontSize={16} color="$color12">
                    {t.dateFormat}
                  </Text>
                </XStack>
                <XStack gap="$2" accessibilityRole="radiogroup">
                  {(['MDY', 'DMY'] as const).map((f) => {
                    const selected = dateFormat === f;
                    const label = f === 'MDY' ? 'MM/DD' : 'DD/MM';
                    return (
                      <Button
                        key={f}
                        size="$2"
                        bg={selected ? '$blue9' : '$color3'}
                        onPress={() => setDateFormat(f)}
                        accessible={true}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={label}
                      >
                        <Text color={selected ? 'white' : '$color12'} fontSize={12} fontWeight="600">
                          {label}
                        </Text>
                      </Button>
                    );
                  })}
                </XStack>
              </XStack>
            </Card>

            {/* Language Selector */}
            <Card
              bg="$color2"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
              px="$4"
              py="$3.5"
              pressStyle={{ bg: '$color3' }}
              onPress={() => setShowLanguagePicker(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${t.language}: ${currentLangOption?.nativeLabel}`}
              accessibilityHint="Opens language selection"
            >
              <XStack items="center" justify="space-between">
                <XStack items="center" gap="$3">
                  <MaterialCommunityIcons
                    name="translate"
                    size={22}
                    color="#888"
                  />
                  <Text fontSize={16} color="$color12">
                    {t.language}
                  </Text>
                </XStack>
                <XStack items="center" gap="$2">
                  <Text fontSize={15} color="$color10">
                    {currentLangOption?.nativeLabel}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={22} color="#888" />
                </XStack>
              </XStack>
            </Card>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
