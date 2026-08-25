import { useState } from 'react';
import { Alert, AccessibilityInfo } from 'react-native';
import { ScrollView, YStack, XStack, Text, Card, Switch } from 'tamagui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useNow } from '../hooks/useNow';
import { useGeolocation } from '../hooks/useGeolocation';
import { SettingsButton } from '../components/SettingsButton';
import { SettingsModal } from '../components/SettingsModal';
import { AddLocationModal } from '../components/AddLocationModal';
import { scheduler } from '../lib/scheduler';
import { getTranslations, translateLabel } from '../lib/i18n';
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
  const language = useStore((s) => s.language);
  const [adding, setAdding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [perm, setPerm] = useState(scheduler.permission());
  const { geoInfo } = useGeolocation();

  const t = getTranslations(language);
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
    const label = translateLabel(alarm.label, language);
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
        <Text 
          fontSize={34} 
          fontWeight="600" 
          color="$color12"
          accessibilityRole="header"
        >
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
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t.addLocation}
            accessibilityHint="Opens dialog to add a new location"
          >
            <Text fontSize={24} color="$blue10" lineHeight={26} aria-hidden>
              +
            </Text>
          </XStack>
        </XStack>
      </XStack>

      {geoInfo && (
        <XStack 
          items="center" 
          gap="$1.5" 
          px="$4" 
          pb="$2"
          accessible={true}
          accessibilityLabel={`Current location: ${[geoInfo.city, geoInfo.region].filter(Boolean).join(', ')}, ${geoInfo.time}, ${geoInfo.timezone}`}
        >
          <MaterialCommunityIcons name="map-marker" size={14} color="#888" accessibilityElementsHidden />
          <Text color="$color10" fontSize={13}>
            {[geoInfo.city, geoInfo.region, geoInfo.postalCode].filter(Boolean).join(', ')} {geoInfo.time} {geoInfo.timezone}
          </Text>
        </XStack>
      )}

      {alarmQueueText ? (
        <XStack 
          items="center" 
          gap="$1.5" 
          px="$4" 
          pb="$3"
          accessible={true}
          accessibilityLabel={`${t.next} alarm: ${alarmQueueText}`}
          accessibilityRole="text"
        >
          <MaterialCommunityIcons name="alarm" size={14} color="#888" accessibilityElementsHidden />
          <Text color="$color10" fontSize={13} numberOfLines={2}>
            {t.next}: {alarmQueueText}
          </Text>
        </XStack>
      ) : (
        <XStack 
          items="center" 
          gap="$1.5" 
          px="$4" 
          pb="$3"
          accessible={true}
          accessibilityLabel={t.noUpcomingAlarms}
        >
          <MaterialCommunityIcons name="alarm-off" size={14} color="#888" accessibilityElementsHidden />
          <Text color="$color10" fontSize={13}>
            {t.noUpcomingAlarms}
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
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={t.enableReminders}
        >
          <XStack items="center" justify="space-between">
            <Text 
              color="$blue11" 
              fontSize={13} 
              fontWeight="600" 
              flex={1}
              onPress={async () => {
                const granted = await scheduler.requestPermission();
                setPerm(scheduler.permission());
                if (granted) {
                  dismissNotificationPrompt();
                }
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t.enableReminders}
              accessibilityHint="Tap to enable alarm notifications"
            >
              {t.enableReminders}
            </Text>
            <Text
              color="$blue10"
              fontSize={16}
              fontWeight="600"
              px="$2"
              onPress={dismissNotificationPrompt}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification prompt"
            >
              X
            </Text>
          </XStack>
        </Card>
      )}

      {/* Fixed CURRENT section */}
      <YStack px="$4" pt="$2">
        <Text 
          color="$color10" 
          fontSize={12} 
          fontWeight="700" 
          mb="$2" 
          ml="$1"
          accessibilityRole="header"
        >
          {t.current}
        </Text>
        
        {currentLocation ? (
          <LocationCard
            key={currentLocation.id}
            loc={currentLocation}
            now={now}
            nextText={nextText(alarms.filter((a) => a.locationId === currentLocation.id), currentLocation.ianaZone, now, use24Hour)}
            onPress={() => onOpen(currentLocation.id)}
            onLongPress={() => handleLongPress(currentLocation)}
            onToggleDisabled={() => toggleLocationDisabled(currentLocation.id)}
            t={t}
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
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Add ${displayNameForZoneWithHint(active, geoInfo?.city)} to your locations`}
            accessibilityHint={t.createAlarmsFor}
          >
            <XStack items="center" justify="space-between" gap="$3">
              <YStack flex={1} gap="$1">
                <Text fontSize={16} fontWeight="600" color="$blue11">
                  Add {displayNameForZoneWithHint(active, geoInfo?.city)}
                </Text>
                <Text fontSize={13} color="$blue10">
                  {t.createAlarmsFor}
                </Text>
              </YStack>
              <XStack
                width={36}
                height={36}
                rounded={999}
                items="center"
                justify="center"
                bg="$blue9"
                aria-hidden
              >
                <Text fontSize={22} color="white" lineHeight={24}>
                  +
                </Text>
              </XStack>
            </XStack>
          </Card>
        )}

        {savedLocations.length > 0 && (
          <Text 
            color="$color10" 
            fontSize={12} 
            fontWeight="700" 
            mt="$5" 
            mb="$2" 
            ml="$1"
            accessibilityRole="header"
          >
            {t.saved}
          </Text>
        )}
      </YStack>

      {/* Scrollable SAVED section */}
      {savedLocations.length > 0 && (
        <ScrollView flex={1}>
          <YStack px="$4" pb={40} gap="$3">
            {savedLocations.map((loc) => (
              <LocationCard
                key={loc.id}
                loc={loc}
                now={now}
                nextText={nextText(alarms.filter((a) => a.locationId === loc.id), loc.ianaZone, now, use24Hour)}
                onPress={() => onOpen(loc.id)}
                onLongPress={() => handleLongPress(loc)}
                onToggleDisabled={() => toggleLocationDisabled(loc.id)}
                t={t}
              />
            ))}
          </YStack>
        </ScrollView>
      )}

      <AddLocationModal visible={adding} onClose={() => setAdding(false)} />
      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </YStack>
  );
}

function nextText(alarms: Alarm[], zone: string, now: ReturnType<typeof useNow>, use24Hour: boolean) {
  const up = nextUpcoming(alarms, now);
  if (!up) return null;
  return `${up.alarm.label} · ${displayInZone(up.instant, zone, use24Hour)} · ${countdownTo(up.instant, now)}`;
}

function LocationCard({
  loc,
  now,
  nextText,
  onPress,
  onLongPress,
  onToggleDisabled,
  t,
}: {
  loc: Location;
  now: ReturnType<typeof useNow>;
  nextText: string | null;
  onPress: () => void;
  onLongPress: () => void;
  onToggleDisabled: () => void;
  t: ReturnType<typeof getTranslations>;
}) {
  const use24Hour = useStore((s) => s.use24Hour);
  const local = now.setZone(loc.ianaZone);
  const isEnabled = !loc.disabled;
  const displayName = formatLocationName(loc.name, loc.ianaZone);
  const timeFormat = use24Hour ? 'HH:mm' : 'h:mm a';
  const timeString = local.toFormat(timeFormat);
  const dateString = local.toFormat('cccc, LLL d');
  
  const accessibilityLabel = [
    displayName,
    loc.isHome ? 'Home location' : '',
    dateString,
    timeString,
    isEnabled ? t.on : t.off,
    loc.disabled ? t.silenced : nextText ? `${t.next}: ${nextText}` : t.noAlarms,
  ].filter(Boolean).join(', ');

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
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to view alarms, long press to delete"
    >
      <XStack items="center" justify="space-between" gap="$3" importantForAccessibility="no-hide-descendants">
        <YStack flex={1} minW={0} gap="$1.5">
          <Text fontSize={18} lineHeight={23} fontWeight="700" color="$color12" numberOfLines={1}>
            {displayName}
          </Text>
          <XStack items="center" gap="$1.5">
            {loc.isHome && (
              <MaterialCommunityIcons name="home" size={14} color="#3b82f6" />
            )}
            <Text color="$color10" fontSize={13} lineHeight={17} numberOfLines={1}>
              {dateString}
            </Text>
          </XStack>
        </YStack>
        <XStack items="baseline" gap="$1" shrink={0}>
          <Text fontSize={40} lineHeight={44} fontWeight="200" color="$color12">
            {local.toFormat(use24Hour ? 'HH:mm' : 'h:mm')}
          </Text>
          {!use24Hour && (
            <Text fontSize={14} fontWeight="500" color="$color10">
              {local.toFormat('a')}
            </Text>
          )}
        </XStack>
      </XStack>
      <XStack items="center" justify="space-between" mt="$3.5" gap="$3">
        <XStack 
          items="center" 
          gap="$2"
          accessible={true}
          accessibilityRole="switch"
          accessibilityState={{ checked: isEnabled }}
          accessibilityLabel={`${displayName} alarms ${isEnabled ? 'enabled' : 'disabled'}`}
          onPress={(e) => {
            e.stopPropagation();
            onToggleDisabled();
          }}
        >
          <Switch
            size="$2"
            checked={isEnabled}
            onCheckedChange={() => onToggleDisabled()}
            backgroundColor={isEnabled ? '$blue9' : '$color5'}
            accessibilityElementsHidden
          >
            <Switch.Thumb backgroundColor="white" />
          </Switch>
          <Text fontSize={12} fontWeight="600" color={isEnabled ? '$blue10' : '$color10'}>
            {isEnabled ? t.on : t.off}
          </Text>
        </XStack>
        <Text color="$color10" fontSize={13} shrink={1} text="right" numberOfLines={1}>
          {loc.disabled ? t.silenced : nextText ? `${t.next}: ${nextText}` : t.noAlarms}
        </Text>
      </XStack>
    </Card>
  );
}
