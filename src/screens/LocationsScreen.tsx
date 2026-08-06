import { useState } from 'react';
import { ScrollView, YStack, XStack, Text, Card, Button } from 'tamagui';
import { useStore } from '../store';
import { useNow } from '../hooks/useNow';
import { StatusChip } from '../components/StatusChip';
import { ThemeToggle } from '../components/ThemeToggle';
import { AddLocationModal } from '../components/AddLocationModal';
import { scheduler } from '../lib/scheduler';
import {
  workStatus,
  currentZone,
  nextUpcoming,
  displayInZone,
  countdownTo,
} from '../lib/schedule';
import type { Location, Alarm } from '../types';

export function LocationsScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const now = useNow();
  const locations = useStore((s) => s.locations);
  const alarms = useStore((s) => s.alarms);
  const workday = useStore((s) => s.workday);
  const [adding, setAdding] = useState(false);
  const [perm, setPerm] = useState(scheduler.permission());

  const status = workStatus(workday, now);
  const active = currentZone();
  const ordered = [...locations].sort((a, b) => a.order - b.order);

  return (
    <YStack flex={1}>
      <XStack items="center" justify="space-between" px="$4" pt="$4" pb="$3">
        <Text fontSize={34} fontWeight="800" color="$color12">
          Moondial
        </Text>
        <XStack items="center" gap="$2.5">
          <ThemeToggle />
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

      {perm === 'default' && (
        <Card
          mx="$4"
          mb="$2"
          bg="$blue4"
          px="$3.5"
          py="$2.5"
          pressStyle={{ opacity: 0.85 }}
          onPress={async () => {
            await scheduler.requestPermission();
            setPerm(scheduler.permission());
          }}
        >
          <Text color="$blue11" fontSize={13} fontWeight="600" text="center">
            Enable reminders — tap to allow notifications
          </Text>
        </Card>
      )}

      <ScrollView>
        <YStack px="$4" pt="$2" pb={40} gap="$3">
          {ordered.map((loc) => (
            <LocationCard
              key={loc.id}
              loc={loc}
              isActive={loc.ianaZone === active}
              statusFor={status}
              now={now}
              nextText={nextText(alarms.filter((a) => a.locationId === loc.id), loc.ianaZone, now)}
              onPress={() => onOpen(loc.id)}
            />
          ))}
          <Text color="$color10" fontSize={12} lineHeight={17} px="$2" mt="$2">
            Reminders are soft browser notifications and fire only while this app is open. Loud,
            wake-you-up alarms arrive in the iOS app.
          </Text>
        </YStack>
      </ScrollView>

      <AddLocationModal visible={adding} onClose={() => setAdding(false)} />
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
  isActive,
  statusFor,
  now,
  nextText,
  onPress,
}: {
  loc: Location;
  isActive: boolean;
  statusFor: ReturnType<typeof workStatus>;
  now: ReturnType<typeof useNow>;
  nextText: string | null;
  onPress: () => void;
}) {
  const local = now.setZone(loc.ianaZone);
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
    >
      <XStack items="center" justify="space-between" gap="$3">
        <YStack flex={1} minW={0} gap="$1.5">
          <XStack items="center" gap="$2" minW={0}>
            <Text fontSize={18} lineHeight={23} fontWeight="700" color="$color12" shrink={1} numberOfLines={1}>
              {loc.name}
            </Text>
            {isActive && <Badge label="HERE" tone="accent" />}
            {loc.isHome && <Badge label="HOME" tone="muted" />}
          </XStack>
          <Text color="$color10" fontSize={13} lineHeight={17} numberOfLines={1}>
            {local.toFormat('cccc, LLL d')}
          </Text>
        </YStack>
        <XStack items="baseline" gap="$1" shrink={0}>
          <Text fontSize={40} lineHeight={44} fontWeight="200" color="$color12">
            {local.toFormat('h:mm')}
          </Text>
          <Text fontSize={14} fontWeight="500" color="$color10">
            {local.toFormat('a')}
          </Text>
        </XStack>
      </XStack>
      <XStack items="center" justify="space-between" mt="$3.5" gap="$3">
        <StatusChip status={statusFor} />
        <Text color="$color10" fontSize={13} shrink={1} text="right" numberOfLines={1}>
          {nextText ? `Next: ${nextText}` : 'No upcoming alarms'}
        </Text>
      </XStack>
    </Card>
  );
}

function Badge({ label, tone }: { label: string; tone: 'accent' | 'muted' }) {
  const isAccent = tone === 'accent';
  return (
    <XStack
      items="center"
      bg={isAccent ? '$blue4' : '$color4'}
      px="$2"
      py={3}
      rounded="$3"
    >
      <Text fontSize={10} fontWeight="800" letterSpacing={0.5} color={isAccent ? '$blue11' : '$color10'}>
        {label}
      </Text>
    </XStack>
  );
}
