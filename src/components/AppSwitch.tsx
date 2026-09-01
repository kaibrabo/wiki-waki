import { useEffect, useRef } from 'react';
import { Animated, Pressable, useColorScheme } from 'react-native';

// iOS-accurate toggle. Tamagui's built-in Switch needs an animation driver (not
// configured here), so we build our own from React Native primitives: a pill
// track that cross-fades color and a circular thumb that slides. Uses RN's
// Animated (JS driver) — no extra deps, works in production.

const TRACK_W = 51;
const TRACK_H = 31;
const THUMB = 27;
const PAD = 2;

const ON_COLOR = '#34C759'; // iOS green
const OFF_LIGHT = '#E9E9EA';
const OFF_DARK = '#39393D';

export function AppSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const scheme = useColorScheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_W - THUMB - PAD * 2],
  });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [scheme === 'dark' ? OFF_DARK : OFF_LIGHT, ON_COLOR],
  });

  return (
    <Pressable onPress={() => onValueChange(!value)} hitSlop={6}>
      <Animated.View
        style={{
          width: TRACK_W,
          height: TRACK_H,
          borderRadius: TRACK_H / 2,
          padding: PAD,
          justifyContent: 'center',
          backgroundColor: trackColor,
        }}
      >
        <Animated.View
          style={{
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: '#ffffff',
            transform: [{ translateX }],
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 1.5,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
