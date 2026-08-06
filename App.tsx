import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, Theme, YStack, Text } from 'tamagui';
import { tamaguiConfig } from './tamagui.config';
import { useStore, migrateFromAnchorStore } from './src/store';
import { scheduler } from './src/lib/scheduler';
import { useEffectiveTheme } from './src/hooks/useEffectiveTheme';
import { LocationsScreen } from './src/screens/LocationsScreen';
import { LocationDetailScreen } from './src/screens/LocationDetailScreen';

type Route = { name: 'locations' } | { name: 'detail'; id: string };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'locations' });
  const hasHydrated = useStore((s) => s.hasHydrated);
  const theme = useEffectiveTheme();

  // Migrate data from old 'anchor-store-v2' to 'moondial-store-v1' on first launch
  useEffect(() => {
    migrateFromAnchorStore();
  }, []);

  // Start the reminder loop once; it reads live alarms from the store each tick.
  useEffect(() => {
    const stop = scheduler.start(() => useStore.getState().alarms);
    return stop;
  }, []);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
      <Theme name={theme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme === 'dark' ? '#000' : '#fff' }}>
          <YStack flex={1} bg="$background">
            {!hasHydrated ? (
              <YStack flex={1} items="center" justify="center">
                <Text color="$color10" fontSize={22}>
                  Moondial
                </Text>
              </YStack>
            ) : route.name === 'locations' ? (
              <LocationsScreen onOpen={(id) => setRoute({ name: 'detail', id })} />
            ) : (
              <LocationDetailScreen id={route.id} onBack={() => setRoute({ name: 'locations' })} />
            )}
          </YStack>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        </SafeAreaView>
      </Theme>
    </TamaguiProvider>
  );
}
