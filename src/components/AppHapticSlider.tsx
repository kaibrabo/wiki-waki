// A 4-stop slider for the alarm's haptic level (None / Light / Medium / Heavy).
//
// Built from RN core PanResponder + Tamagui primitives (no native slider module,
// matching the project's custom-primitive approach, e.g. AppSwitch). Dragging or
// tapping snaps the thumb to the nearest of four stops and calls onChange only
// when the stop changes, so the parent can preview the haptic once per step.

import { useRef } from 'react';
import { PanResponder, View } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { HAPTIC_OPTIONS } from '../lib/alarmSounds';
import type { AlarmHaptic } from '../types';

const STOPS: AlarmHaptic[] = HAPTIC_OPTIONS.map((o) => o.id); // [none, light, medium, heavy]
const LAST = STOPS.length - 1;
const THUMB = 26;

export function AppHapticSlider({
  value,
  onChange,
}: {
  value: AlarmHaptic;
  onChange: (v: AlarmHaptic) => void;
}) {
  const trackWidth = useRef(0);
  const trackLeft = useRef(0);
  const currentIdx = Math.max(0, STOPS.indexOf(value));

  const stopFromX = (x: number): number => {
    const w = trackWidth.current;
    if (w <= 0) return currentIdx;
    const ratio = Math.min(1, Math.max(0, x / w));
    return Math.round(ratio * LAST);
  };

  const commit = (idx: number) => {
    const clamped = Math.min(LAST, Math.max(0, idx));
    if (STOPS[clamped] !== value) onChange(STOPS[clamped]);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        trackLeft.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
        commit(stopFromX(e.nativeEvent.locationX));
      },
      onPanResponderMove: (_e, g) => {
        commit(stopFromX(g.moveX - trackLeft.current));
      },
    })
  ).current;

  // Thumb + fill positioned by fraction of the track.
  const fraction = LAST === 0 ? 0 : currentIdx / LAST;

  return (
    <YStack gap="$2">
      {/* Track (the PanResponder surface). Extra vertical padding = bigger touch target. */}
      <View
        {...pan.panHandlers}
        onLayout={(e) => {
          trackWidth.current = e.nativeEvent.layout.width;
        }}
        style={{ height: THUMB, justifyContent: 'center' }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Haptics level"
        accessibilityValue={{ text: HAPTIC_OPTIONS[currentIdx]?.label ?? value }}
      >
        {/* Base track */}
        <XStack
          height={4}
          rounded={999}
          bg="$color5"
          items="center"
          pointerEvents="none"
          position="relative"
        >
          {/* Filled portion */}
          <XStack
            position="absolute"
            l={0}
            t={0}
            height={4}
            rounded={999}
            bg="$blue9"
            width={`${fraction * 100}%`}
          />
          {/* Stop ticks */}
          {STOPS.map((id, i) => (
            <XStack
              key={id}
              position="absolute"
              l={`${(i / LAST) * 100}%`}
              width={8}
              height={8}
              rounded={999}
              bg={i <= currentIdx ? '$blue9' : '$color6'}
              t={-2}
              ml={-4}
            />
          ))}
        </XStack>
        {/* Thumb */}
        <XStack
          position="absolute"
          l={`${fraction * 100}%`}
          ml={-THUMB / 2}
          width={THUMB}
          height={THUMB}
          rounded={999}
          bg="white"
          borderWidth={1}
          borderColor="$color7"
          items="center"
          justify="center"
          pointerEvents="none"
          shadowColor="#000"
          shadowOpacity={0.18}
          shadowRadius={3}
          shadowOffset={{ width: 0, height: 1 }}
        >
          <XStack width={10} height={10} rounded={999} bg="$blue9" />
        </XStack>
      </View>

      {/* Labels: tappable, current one highlighted. */}
      <XStack justify="space-between">
        {HAPTIC_OPTIONS.map((opt, i) => (
          <Text
            key={opt.id}
            fontSize={12}
            fontWeight={i === currentIdx ? '700' : '500'}
            color={i === currentIdx ? '$blue10' : '$color10'}
            onPress={() => commit(i)}
            accessibilityRole="button"
            accessibilityLabel={`${opt.label} haptic`}
          >
            {opt.label}
          </Text>
        ))}
      </XStack>
    </YStack>
  );
}
