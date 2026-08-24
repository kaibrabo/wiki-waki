import { useState } from 'react';
import { Alert } from 'react-native';
import { ScrollView, YStack, XStack, Text, Card, Button, Switch } from 'tamagui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useNow } from '../hooks/useNow';
import { AppSwitch } from '../components/AppSwitch';
import { AlarmEditor } from '../components/AlarmEditor';
import { nextFireInstant, displayInZone, recurrenceLabel } from '../lib/schedule';
import { formatLocationName } from '../lib/zones';
import { getTranslations, translateLabel, type Language } from '../lib/i18n';
import type { Alarm } from '../types';

export function LocationDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const now = useNow();
  const location = useStore((s) => s.locations.find((l) => l.id === id));
  const alarms = useStore((s) => s.alarms);
  const removeLocation = useStore((s) => s.removeLocation);
  const toggleHome = useStore((s) => s.toggleHome);
  const use24Hour = useStore((s) => s.use24Hour);
  const language = useStore((s) => s.language);
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const t = getTranslations(language);

  if (!location) {
    return (
      <YStack flex={1}>
        <TopBar onBack={onBack} title="" />
        <Text color="$color10" text="center" mt="$8">
          Location not found.
        </Text>
      </YStack>
    );
  }

  const local = now.setZone(location.ianaZone);

  const owned = alarms
    .filter((a) => a.locationId === location.id)
    .map((a) => ({ alarm: a, instant: nextFireInstant(a, now) }))
    .sort((x, y) => {
      if (!x.instant) return 1;
      if (!y.instant) return -1;
      return x.instant.toMillis() - y.instant.toMillis();
    });

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (a: Alarm) => {
    setEditing(a);
    setEditorOpen(true);
  };

  const displayName = formatLocationName(location.name, location.ianaZone);
  const timeFormat = use24Hour ? 'HH:mm' : 'h:mm';

  return (
    <YStack flex={1}>
      <TopBar
        onBack={onBack}
        title={displayName}
        right={
          <Button 
            size="$3" 
            circular 
            chromeless 
            onPress={openNew}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t.newAlarm}
            accessibilityHint="Opens dialog to create a new alarm"
          >
            <Text fontSize={24} color="$blue10" aria-hidden>
              +
            </Text>
          </Button>
        }
      />

      <ScrollView>
        <YStack px="$4" pb={40}>
        <XStack 
          items="flex-end" 
          justify="center" 
          mt="$4" 
          gap="$2"
          accessible={true}
          accessibilityLabel={`Current time: ${local.toFormat(use24Hour ? 'HH:mm' : 'h:mm a')}`}
        >
          <Text fontSize={76} lineHeight={84} fontWeight="200" color="$color12">
            {local.toFormat(timeFormat)}
          </Text>
          {!use24Hour && (
            <Text fontSize={22} lineHeight={40} color="$color10">
              {local.toFormat('a')}
            </Text>
          )}
        </XStack>
        <Text 
          color="$color10" 
          fontSize={14} 
          lineHeight={20} 
          text="center" 
          mt="$2" 
          mb="$6"
          accessible={true}
          accessibilityLabel={`${local.toFormat('cccc, LLLL d')}, timezone ${local.toFormat('ZZZZ')}`}
        >
          {local.toFormat('cccc, LLLL d')} - {local.toFormat('ZZZZ')}
        </Text>

        <XStack gap="$3" mb="$6">
          <Card 
            width="48%"
            borderWidth={1} 
            borderColor="$borderColor" 
            bg="$color2" 
            rounded="$6" 
            px="$4" 
            py="$3"
            pressStyle={{ bg: '$color3' }}
            onPress={() => toggleHome(location.id)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={location.isHome ? `${displayName} is your home location` : `Set ${displayName} as home`}
            accessibilityState={{ selected: location.isHome }}
          >
            <XStack items="center" justify="center" gap="$2">
              <MaterialCommunityIcons
                name={location.isHome ? 'home' : 'home-outline'}
                size={20}
                color={location.isHome ? '#3b82f6' : '#888'}
              />
              <Text fontSize={15} color={location.isHome ? '$blue10' : '$color12'}>
                {location.isHome ? t.home : t.setHome}
              </Text>
            </XStack>
          </Card>

          <Card 
            width="48%"
            borderWidth={1} 
            borderColor="$borderColor" 
            bg="$color2" 
            rounded="$6" 
            px="$4" 
            py="$3"
            pressStyle={{ bg: '$color3' }}
            onPress={() => {
              Alert.alert(
                t.removeLocation,
                `${t.confirmRemove} ${displayName}?`,
                [
                  { text: t.cancel, style: 'cancel' },
                  { 
                    text: t.remove, 
                    style: 'destructive',
                    onPress: () => {
                      removeLocation(location.id);
                      onBack();
                    }
                  },
                ]
              );
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${displayName}`}
            accessibilityHint="Opens confirmation dialog to delete this location"
          >
            <XStack items="center" justify="center" gap="$2">
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color="#ef4444"
              />
              <Text fontSize={15} color="$red10">
                {t.remove}
              </Text>
            </XStack>
          </Card>
        </XStack>

        <Text 
          color="$color10" 
          fontSize={12} 
          fontWeight="700" 
          mb="$2" 
          ml="$1"
          accessibilityRole="header"
        >
          {t.alarms}
        </Text>

        {owned.length === 0 && (
          <Text 
            color="$color10" 
            fontSize={14} 
            py="$5" 
            text="center"
            onPress={openNew}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Tap plus button ${t.tapToAddAlarm}`}
          >
            Tap <Text color="$blue10" fontSize={24}>+</Text> {t.tapToAddAlarm}
          </Text>
        )}

        <YStack gap="$2.5">
          {owned.map(({ alarm, instant }) => (
            <AlarmRow
              key={alarm.id}
              alarm={alarm}
              localTime={instant ? displayInZone(instant, location.ianaZone) : '-'}
              onPress={() => openEdit(alarm)}
              language={language}
            />
          ))}
        </YStack>
        </YStack>
      </ScrollView>

      <AlarmEditor
        visible={editorOpen}
        onClose={() => setEditorOpen(false)}
        editing={editing}
        locationId={location.id}
        zone={location.ianaZone}
        locationName={location.name}
      />
    </YStack>
  );
}

function AlarmRow({
  alarm,
  localTime,
  onPress,
  language,
}: {
  alarm: Alarm;
  localTime: string;
  onPress: () => void;
  language: Language;
}) {
  const toggleAlarm = useStore((s) => s.toggleAlarm);
  const t = getTranslations(language);
  const dim = alarm.enabled ? 1 : 0.4;
  const label = translateLabel(alarm.label, language);
  const recurrence = recurrenceLabel(alarm.recurrence, language);
  
  const accessibilityLabel = [
    label,
    `at ${localTime}`,
    recurrence,
    alarm.enabled ? 'enabled' : 'disabled',
  ].join(', ');

  return (
    <Card 
      borderWidth={1} 
      borderColor="$borderColor" 
      bg="$color2" 
      rounded="$6" 
      px="$4" 
      py="$3" 
      pressStyle={{ bg: '$color3' }} 
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to edit this alarm"
    >
      <XStack items="center" justify="space-between" gap="$3" importantForAccessibility="no-hide-descendants">
        <YStack flex={1} gap="$1">
          <Text fontSize={28} lineHeight={34} fontWeight="300" color="$color12" opacity={dim}>
            {localTime}
          </Text>
          <Text fontSize={15} lineHeight={19} color="$color12" opacity={dim}>
            {label}
          </Text>
          <Text fontSize={12} lineHeight={16} color="$color10">
            {recurrence}
          </Text>
        </YStack>
        <XStack
          accessible={true}
          accessibilityRole="switch"
          accessibilityLabel={`${label} alarm`}
          accessibilityState={{ checked: alarm.enabled }}
          onPress={(e) => {
            e.stopPropagation();
            toggleAlarm(alarm.id);
          }}
        >
          <AppSwitch value={alarm.enabled} onValueChange={() => toggleAlarm(alarm.id)} />
        </XStack>
      </XStack>
    </Card>
  );
}

function TopBar({
  onBack,
  title,
  right,
}: {
  onBack: () => void;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <XStack items="center" px="$3" pt="$2" pb="$2">
      <Button 
        size="$3" 
        chromeless 
        onPress={onBack} 
        px="$2" 
        mr="$2" 
        justify="flex-start"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text color="$blue10" fontSize={28} aria-hidden>
          &#8249;
        </Text>
      </Button>
      <Text 
        flex={1} 
        fontSize={17} 
        fontWeight="600" 
        color="$color12" 
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {right}
    </XStack>
  );
}
