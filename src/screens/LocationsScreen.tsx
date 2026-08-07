import { useState } from 'react';
import { Alert } from 'react-native';
import { ScrollView, YStack, XStack, Text, Card, Switch } from 'tamagui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useNow } from '../hooks/useNow';
import { useGeolocation } from '../hooks/useGeolocation';
import { SettingsButton } from '../components/SettingsButton';
import { SettingsModal } from '../components/SettingsModal';
import { AddLocationModal } from '../components/AddLocationModal';
import { scheduler } from '../lib/scheduler';
import {
  currentZone,
  nextUpcoming,
  displayInZone,
  countdownTo,
  allUpcomingAlarms,
} from '../lib/schedule';
import { formatLocationName, displayNameForZoneWithHint, labelForZoneWithHint, codeForLocation } from '../lib/zones';
import type { Location, Alarm } from '../types';

export function LocationsScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const now = useNow();
  const locations = useStore((s) => s.locations);
  const alarms = useStore((s) => s.alarms);
  const addLocation = useStore((s) => s.addLocation);
  const removeLocation = useStore((s) => s.removeLocation);
  const toggleLocationDisabled = useStore((s) => s.toggleLocationDisabled);
  const notificationPromptDismissed = useStore((s) => s.notificationPromptDismissed);
  const dismissNotificationPrompt = useStore((s) => s.dismissNotificationPrompt);
  const [adding, setAdding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [perm, setPerm] = useState(scheduler.permission());
  const { geoInfo } = useGeolocation();

  const active = currentZone();
  const use24Hour = useStore((s) => s.use24Hour);
  
  // Check if we have a saved location matching current timezone
  const currentLocation = locations.find((l) => l.ianaZone === active);
  const savedLocations = locations.filter((l) => l.ianaZone !== active).sort((a, b) => a.order - b.order);

  // Get enabled alarms from non-disabled locations
  const enabledLocationIds = new Set(locations.filter(l => !l.disabled).map(l => l.id));
  const activeAlarms = alarms.filter(a => a.enabled && enabledLocationIds.has(a.locationId));
  const upcomingAlarms = allUpcomingAlarms(activeAlarms, now);

  // Format alarm queue string - show next alarm prominently with countdown
  const alarmQueueText = (() => {
    if (upcomingAlarms.length === 0) return null;
    const { alarm, instant } = upcomingAlarms[0];
    const loc = locations.find(l => l.id === alarm.locationId);
    const code = loc ? codeForLocation(loc.name, loc.ianaZone) : null;
    const timeStr = use24Hour 
      ? instant.setZone(alarm.pinnedZone).toFormat('HH:mm')
      : instant.setZone(alarm.pinnedZone).toFormat('h:mm a');
    const label = alarm.label;
    const countdown = countdownTo(instant, now);
    const prefix = code ? `(${code}) ` : '';
    return `${prefix}${timeStr} ${label} ${countdown}`;
  })();

  const handleLongPress = (loc: Location) => {
    if (loc.isHome) {
      Alert.alert('Cannot Delete', 'Home location cannot be deleted.');
      return;
    }
    const displayName = formatLocationName(loc.name, loc.ianaZone);
    Alert.alert(
      'Delete Location',
      `Remove ${displayName} and all its alarms?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeLocation(loc.id) },
      ]
    );
  };

  return (
    <YStack flex={1}>
      <XStack items="center" justify="space-between" px="$4" pt="$4" pb="$3">
        <Text fontSize={34} fontWeight="800" color="$color12">
          Moondial
        </Text>
        <XStack items="center" gap="$2.5">
          <SettingsButton onPress={() => setSettingsOpen(true)} />
          <XStack
            width={38}
            height={38}
            rounded={999}
            items="center"
            justify="center"
            bg="$blue4"
            pressStyle={{ bg: '$blue6' }}
            cursor="pointer"
            onPress={() => setAdding(true)}
            aria-label="Add location"
          >
            <Text fontSize={24} color="$blue10" lineHeight={26}>
              ＋
            </Text>
          </XStack>
        </XStack>
      </XStack>

      {geoInfo && (
        <XStack items="center" gap="$1.5" px="$4" pb="$2">
          <MaterialCommunityIcons name="map-marker" size={14} color="#888" />
          <Text color="$color10" fontSize={13}>
            {[geoInfo.city, geoInfo.region, geoInfo.postalCode].filter(Boolean).join(', ')} {geoInfo.time} {geoInfo.timezone}
          </Text>
        </XStack>
      )}

      {alarmQueueText ? (
        <XStack items="center" gap="$1.5" px="$4" pb="$3">
          <MaterialCommunityIcons name="alarm" size={14} color="#888" />
          <Text color="$color10" fontSize={13} numberOfLines={2}>
            Next: {alarmQueueText}
          </Text>
        </XStack>
      ) : (
        <XStack items="center" gap="$1.5" px="$4" pb="$3">
          <MaterialCommunityIcons name="alarm-off" size={14} color="#888" />
          <Text color="$color10" fontSize={13}>
            No upcoming alarms
          </Text>
        </XStack>
      )}

      {perm === 'default' && !notificationPromptDismissed && (
        <Card
          mx="$4"
          mb="$2"
          bg="$blue4"
          px="$3.5"
          py="$2.5"
        >
          <XStack items="center" justify="space-between">
            <Text 
              color="$blue11" 
              fontSize={13} 
              fontWeight="600" 
              flex={1}
              onPress={async () => {
                await scheduler.requestPermission();
                setPerm(scheduler.permission());
              }}
            >
              Enable reminders — tap to allow notifications
            </Text>
            <Text
              color="$blue10"
              fontSize={16}
              fontWeight="600"
              px="$2"
              onPress={dismissNotificationPrompt}
            >
              ✕
            </Text>
          </XStack>
        </Card>
      )}

      <ScrollView>
        <YStack px="$4" pt="$2" pb={40}>
          <Text color="$color10" fontSize={12} fontWeight="700" mb="$2" ml="$1">
            CURRENT
          </Text>
          
          {currentLocation ? (
            <LocationCard
              key={currentLocation.id}
              loc={currentLocation}
              now={now}
              nextText={nextText(alarms.filter((a) => a.locationId === currentLocation.id), currentLocation.ianaZone, now)}
              onPress={() => onOpen(currentLocation.id)}
              onLongPress={() => handleLongPress(currentLocation)}
              onToggleDisabled={() => toggleLocationDisabled(currentLocation.id)}
            />
          ) : (
            <Card
              borderWidth={1}
              borderColor="$blue8"
              borderStyle="dashed"
              bg="$blue2"
              rounded="$8"
              px="$4"
              py="$3.5"
              pressStyle={{ bg: '$blue3' }}
              onPress={() => {
                const label = labelForZoneWithHint(active, geoInfo?.city);
                addLocation(label, active);
              }}
            >
              <XStack items="center" justify="space-between" gap="$3">
                <YStack flex={1} gap="$1">
                  <Text fontSize={16} fontWeight="600" color="$blue11">
                    Add {displayNameForZoneWithHint(active, geoInfo?.city)}
                  </Text>
                  <Text fontSize={13} color="$blue10">
                    Create alarms for your current location
                  </Text>
                </YStack>
                <XStack
                  width={36}
                  height={36}
                  rounded={999}
                  items="center"
                  justify="center"
                  bg="$blue9"
                >
                  <Text fontSize={22} color="white" lineHeight={24}>
                    ＋
                  </Text>
                </XStack>
              </XStack>
            </Card>
          )}

          {savedLocations.length > 0 && (
            <>
              <Text color="$color10" fontSize={12} fontWeight="700" mt="$5" mb="$2" ml="$1">
                SAVED
              </Text>
              <YStack gap="$3">
                {savedLocations.map((loc) => (
                  <LocationCard
                    key={loc.id}
                    loc={loc}
                    now={now}
                    nextText={nextText(alarms.filter((a) => a.locationId === loc.id), loc.ianaZone, now)}
                    onPress={() => onOpen(loc.id)}
                    onLongPress={() => handleLongPress(loc)}
                    onToggleDisabled={() => toggleLocationDisabled(loc.id)}
                  />
                ))}
              </YStack>
            </>
          )}
        </YStack>
      </ScrollView>

      <AddLocationModal visible={adding} onClose={() => setAdding(false)} />
      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </YStack>
  );
}

function nextText(alarms: Alarm[], zone: string, now: ReturnType<typeof useNow>) {
  const up = nextUpcoming(alarms, now);
  if (!up) return null;
  return `${up.alarm.label} · ${displayInZone(up.instant, zone)} · ${countdownTo(up.instant, now)}`;
}

function LocationCard({
  loc,
  now,
  nextText,
  onPress,
  onLongPress,
  onToggleDisabled,
}: {
  loc: Location;
  now: ReturnType<typeof useNow>;
  nextText: string | null;
  onPress: () => void;
  onLongPress: () => void;
  onToggleDisabled: () => void;
}) {
  const use24Hour = useStore((s) => s.use24Hour);
  const local = now.setZone(loc.ianaZone);
  const isEnabled = !loc.disabled;
  const displayName = formatLocationName(loc.name, loc.ianaZone);
  const timeFormat = use24Hour ? 'HH:mm' : 'h:mm';
  return (
    <Card
      borderWidth={1}
      borderColor="$borderColor"
      bg="$color2"
      rounded="$8"
      px="$4"
      py="$3.5"
      pressStyle={{ bg: '$color3' }}
      onPress={onPress}
      onLongPress={onLongPress}
      opacity={loc.disabled ? 0.5 : 1}
    >
      <XStack items="center" justify="space-between" gap="$3">
        <YStack flex={1} minW={0} gap="$1.5">
          <Text fontSize={18} lineHeight={23} fontWeight="700" color="$color12" numberOfLines={1}>
            {displayName}
          </Text>
          <XStack items="center" gap="$1.5">
            {loc.isHome && (
              <MaterialCommunityIcons name="home" size={14} color="#3b82f6" />
            )}
            <Text color="$color10" fontSize={13} lineHeight={17} numberOfLines={1}>
              {local.toFormat('cccc, LLL d')}
            </Text>
          </XStack>
        </YStack>
        <XStack items="baseline" gap="$1" shrink={0}>
          <Text fontSize={40} lineHeight={44} fontWeight="200" color="$color12">
            {local.toFormat(timeFormat)}
          </Text>
          {!use24Hour && (
            <Text fontSize={14} fontWeight="500" color="$color10">
              {local.toFormat('a')}
            </Text>
          )}
        </XStack>
      </XStack>
      <XStack items="center" justify="space-between" mt="$3.5" gap="$3">
        <XStack items="center" gap="$2">
          <Switch
            size="$2"
            checked={isEnabled}
            onCheckedChange={() => onToggleDisabled()}
            backgroundColor={isEnabled ? '$blue9' : '$color5'}
          >
            <Switch.Thumb backgroundColor="white" />
          </Switch>
          <Text fontSize={12} fontWeight="600" color={isEnabled ? '$blue10' : '$color10'}>
            {isEnabled ? 'On' : 'Off'}
          </Text>
        </XStack>
        <Text color="$color10" fontSize={13} shrink={1} text="right" numberOfLines={1}>
          {loc.disabled ? 'Silenced' : nextText ? `Next: ${nextText}` : 'No upcoming alarms'}
        </Text>
      </XStack>
    </Card>
  );
}
