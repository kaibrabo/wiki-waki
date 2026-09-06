import { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, Theme, YStack, Text } from 'tamagui';
import { tamaguiConfig } from './tamagui.config';
import { useStore, migrateFromAnchorStore } from './src/store';
import { scheduler } from './src/lib/scheduler';
import { useEffectiveTheme } from './src/hooks/useEffectiveTheme';
import { useWidgetSync } from './src/hooks/useWidgetSync';
import { LocationsScreen } from './src/screens/LocationsScreen';
import { LocationDetailScreen } from './src/screens/LocationDetailScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Toast } from './src/components/Toast';

type Route = { name: 'locations' } | { name: 'detail'; id: string };

function AppInner() {
  const [route, setRoute] = useState<Route>({ name: 'locations' });
  const hasHydrated = useStore((s) => s.hasHydrated);
  const alarms = useStore((s) => s.alarms);
  const locations = useStore((s) => s.locations);
  const theme = useEffectiveTheme();

  // Sync widget data whenever alarms or locations change
  useWidgetSync();

  // Migrate data from old 'anchor-store-v2' to 'moondial-store-v1' on first launch
  useEffect(() => {
    migrateFromAnchorStore();
  }, []);

  // Start the reminder loop once; it reads live alarms from the store each tick.
  // Filter out alarms from disabled locations.
  useEffect(() => {
    const stop = scheduler.start(() => {
      const { alarms, locations } = useStore.getState();
      const disabledLocationIds = new Set(
        locations.filter((l) => l.disabled).map((l) => l.id)
      );
      return alarms.filter((a) => !disabledLocationIds.has(a.locationId));
    });
    return stop;
  }, []);

  // Reschedule immediately when alarms or locations change so an alarm set to
  // fire within the next minute isn't missed while waiting for the periodic
  // reconcile tick. Runs once on mount too (harmless - the scheduler's own init
  // already reconciled).
  useEffect(() => {
    scheduler.reschedule();
  }, [alarms, locations]);

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
        <Theme name={theme}>
          <SafeAreaView style={{ flex: 1, backgroundColor: theme === 'dark' ? '#000' : '#fff' }}>
            <YStack flex={1} bg="$background">
              {!hasHydrated ? (
                <YStack flex={1} items="center" justify="center">
                  <Text color="$color10" fontSize={22}>
                    Waimea
                  </Text>
                </YStack>
              ) : (
                <>
                  {/* Keep the list mounted (just hidden) while viewing a location,
                      so returning doesn't re-fetch geolocation / recompute the next
                      alarm - the screen's state is cached in memory, no reload on back. */}
                  <YStack flex={1} display={route.name === 'locations' ? 'flex' : 'none'}>
                    <LocationsScreen onOpen={(id) => setRoute({ name: 'detail', id })} />
                  </YStack>
                  {route.name === 'detail' && (
                    <LocationDetailScreen id={route.id} onBack={() => setRoute({ name: 'locations' })} />
                  )}
                </>
              )}
              <Toast />
            </YStack>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          </SafeAreaView>
        </Theme>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
