import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { DateTime } from 'luxon';

type GeoInfo = {
  city?: string;
  region?: string;
  postalCode?: string;
  time: string;
  timezone: string;
} | null;

export function useGeolocation(): { geoInfo: GeoInfo; loading: boolean; error: string | null } {
  const [geoInfo, setGeoInfo] = useState<GeoInfo>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) {
            setError('Location permission denied');
            setLoading(false);
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

        console.log('Reverse geocode result:', JSON.stringify(address, null, 2));

        if (mounted && address) {
          const now = DateTime.now();
          setGeoInfo({
            city: address.city ?? address.subregion ?? undefined,
            region: address.region ?? undefined,
            postalCode: address.postalCode ?? undefined,
            time: now.toFormat('h:mm'),
            timezone: now.toFormat('ZZZZ'),
          });
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError('Failed to get location');
          setLoading(false);
        }
      }
    }

    fetchLocation();

    // Update time every minute
    const interval = setInterval(() => {
      if (geoInfo) {
        const now = DateTime.now();
        setGeoInfo((prev) =>
          prev ? { ...prev, time: now.toFormat('h:mm'), timezone: now.toFormat('ZZZZ') } : null
        );
      }
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { geoInfo, loading, error };
}
