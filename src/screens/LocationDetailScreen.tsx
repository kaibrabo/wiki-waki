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
import type { Alarm } from '../types';

export function LocationDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const now = useNow();
  const location = useStore((s) => s.locations.find((l) => l.id === id));
  const alarms = useStore((s) => s.alarms);
  const removeLocation = useStore((s) => s.removeLocation);
  const toggleHome = useStore((s) => s.toggleHome);
  const use24Hour = useStore((s) => s.use24Hour);
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

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
          <Button size="$3" circular chromeless onPress={openNew} aria-label="Add alarm">
            <Text fontSize={24} color="$blue10">
              ＋
            </Text>
          </Button>
        }
      />

      <ScrollView>
        <YStack px="$4" pb={40}>
        <XStack items="flex-end" justify="center" mt="$4" gap="$2">
          <Text fontSize={76} lineHeight={84} fontWeight="200" color="$color12">
            {local.toFormat(timeFormat)}
          </Text>
          {!use24Hour && (
            <Text fontSize={22} lineHeight={40} color="$color10">
              {local.toFormat('a')}
            </Text>
          )}
        </XStack>
        <Text color="$color10" fontSize={14} lineHeight={20} text="center" mt="$2" mb="$6">
          {local.toFormat('cccc, LLLL d')} · {local.toFormat('ZZZZ')}
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
          >
            <XStack items="center" justify="center" gap="$2">
              <MaterialCommunityIcons
                name={location.isHome ? 'home' : 'home-outline'}
                size={20}
                color={location.isHome ? '#3b82f6' : '#888'}
              />
              <Text fontSize={15} color={location.isHome ? '$blue10' : '$color12'}>
                {location.isHome ? 'Home' : 'Set Home'}
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
                'Remove Location',
                `Are you sure you want to remove ${displayName}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Remove', 
                    style: 'destructive',
                    onPress: () => {
                      removeLocation(location.id);
                      onBack();
                    }
                  },
                ]
              );
            }}
          >
            <XStack items="center" justify="center" gap="$2">
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color="#ef4444"
              />
              <Text fontSize={15} color="$red10">
                Remove
              </Text>
            </XStack>
          </Card>
        </XStack>

        <Text color="$color10" fontSize={12} fontWeight="700" mb="$2" ml="$1">
          ALARMS
        </Text>

        {owned.length === 0 && (
          <Text color="$color10" fontSize={14} py="$5" text="center">
            Tap + to add alarm
          </Text>
        )}

        <YStack gap="$2.5">
          {owned.map(({ alarm, instant }) => (
            <AlarmRow
              key={alarm.id}
              alarm={alarm}
              localTime={instant ? displayInZone(instant, location.ianaZone) : '—'}
              onPress={() => openEdit(alarm)}
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
}: {
  alarm: Alarm;
  localTime: string;
  onPress: () => void;
}) {
  const toggleAlarm = useStore((s) => s.toggleAlarm);
  const dim = alarm.enabled ? 1 : 0.4;
  return (
    <Card borderWidth={1} borderColor="$borderColor" bg="$color2" rounded="$6" px="$4" py="$3" pressStyle={{ bg: '$color3' }} onPress={onPress}>
      <XStack items="center" justify="space-between" gap="$3">
        <YStack flex={1} gap="$1">
          <Text fontSize={28} lineHeight={34} fontWeight="300" color="$color12" opacity={dim}>
            {localTime}
          </Text>
          <Text fontSize={15} lineHeight={19} color="$color12" opacity={dim}>
            {alarm.label}
          </Text>
          <Text fontSize={12} lineHeight={16} color="$color10">
            {recurrenceLabel(alarm.recurrence)}
          </Text>
        </YStack>
        <AppSwitch value={alarm.enabled} onValueChange={() => toggleAlarm(alarm.id)} />
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
      <Button size="$3" chromeless onPress={onBack} px="$2" minW={110} justify="flex-start">
        <Text color="$blue10" fontSize={17}>
          ‹ Locations
        </Text>
      </Button>
      <Text flex={1} text="center" fontSize={17} fontWeight="600" color="$color12" numberOfLines={1}>
        {title}
      </Text>
      <XStack minW={110} justify="flex-end">
        {right}
      </XStack>
    </XStack>
  );
}
