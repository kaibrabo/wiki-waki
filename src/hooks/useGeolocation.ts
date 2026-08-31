import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { DateTime } from 'luxon';
import { useStore } from '../store';

type GeoInfo = {
  city?: string;
  region?: string;
  postalCode?: string;
  time: string;
  timezone: string;
} | null;

/** Device wall-clock time and timezone abbreviation — available without location. */
function liveClock() {
  const now = DateTime.now();
  return { time: now.toFormat('h:mm'), timezone: now.toFormat('ZZZZ') };
}

function fromCache(place: { city: string | null; region: string | null; postalCode?: string | null } | null): GeoInfo {
  if (!place || (!place.city && !place.region)) return null;
  return {
    city: place.city ?? undefined,
    region: place.region ?? undefined,
    postalCode: place.postalCode ?? undefined,
    ...liveClock(),
  };
}

/**
 * Current place for the home header. To avoid the location "popping in" a few
 * seconds after launch, we seed from the last known place (persisted in the
 * store) right away and mark it `stale`. Once this session's fresh GPS fix
 * resolves, `stale` flips to false and the place updates. The header renders the
 * stale value in italic/dimmed until then.
 */
export function useGeolocation(): {
  geoInfo: GeoInfo;
  stale: boolean;
  loading: boolean;
  error: string | null;
} {
  const cachedPlace = useStore((s) => s.currentPlace);
  const [geoInfo, setGeoInfo] = useState<GeoInfo>(() => fromCache(cachedPlace));
  const [stale, setStale] = useState(true); // true until this session's fresh fix (or a failure)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seed from the cached place if it hydrates after mount.
  useEffect(() => {
    if (stale && !geoInfo) {
      const seeded = fromCache(cachedPlace);
      if (seeded) setGeoInfo(seeded);
    }
  }, [cachedPlace, geoInfo, stale]);

  useEffect(() => {
    let mounted = true;

    async function fetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) {
            setError('Location permission denied');
            setLoading(false);
            setStale(false); // no refresh coming — stop showing the stale style
          }
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (mounted && address) {
          const city = address.city ?? address.subregion ?? undefined;
          const region = address.region ?? undefined;
          const postalCode = address.postalCode ?? undefined;
          setGeoInfo({ city, region, postalCode, ...liveClock() });
          setStale(false);
          setLoading(false);
          // Persist the exact place so it's cached for next launch and the widget.
          useStore.getState().setCurrentPlace({
            city: city ?? null,
            region: region ?? null,
            postalCode: postalCode ?? null,
          });
        }
      } catch (e) {
        if (mounted) {
          setError('Failed to get location');
          setLoading(false);
          setStale(false);
        }
      }
    }

    fetchLocation();

    // Keep the displayed time/timezone current.
    const interval = setInterval(() => {
      setGeoInfo((prev) => (prev ? { ...prev, ...liveClock() } : null));
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { geoInfo, stale, loading, error };
}
