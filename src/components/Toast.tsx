import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { YStack, Text } from 'tamagui';
import { useStore } from '../store';

/**
 * A small confirmation toast rendered once at the app root. Any store action can
 * trigger it by setting `toast` (see mkToast in the store); it fades in near the
 * bottom, holds briefly, then fades out and clears itself. `pointerEvents="none"`
 * so it never blocks taps underneath.
 */
export function Toast() {
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);
  const opacity = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    setMessage(toast.message);
    opacity.stopAnimation();
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    const hide = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => {
        setMessage(null);
        clearToast();
      });
    }, 1700);
    return () => clearTimeout(hide);
    // Re-run whenever a new toast is pushed (toast.id changes on every show).
  }, [toast, opacity, clearToast]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center', opacity }}
    >
      <YStack bg="$blue9" px="$4" py="$2.5" rounded="$10" style={{ maxWidth: '88%' }}>
        <Text color="white" fontSize={14} fontWeight="600" numberOfLines={2} text="center">
          {message}
        </Text>
      </YStack>
    </Animated.View>
  );
}
