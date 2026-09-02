import { useEffect, useState } from 'react';
import { Modal, ScrollView, Linking } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PRODUCT_IDS, refreshPro, IAP, type Offer } from '../lib/iap';
import type { IapProduct } from '../../modules/moondial-iap';

const PRIVACY_URL = 'https://kainoabrabo.com/waimea/privacy/';
// Apple's standard EULA — swap for a custom Terms URL if you host one.
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const BENEFITS = [
  'Unlimited cities and world clocks',
  'Every alarm sound',
  'All widget sizes + Apple Watch complications',
  'Themes, date formats, and advanced repeats',
];

type Props = {
  visible: boolean;
  offer: Offer;
  onClose: () => void;
  onPurchased?: () => void;
};

export function Paywall({ visible, offer, onClose, onPurchased }: Props) {
  const [products, setProducts] = useState<IapProduct[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || offer === 'off') return;
    const ids = offer === 'lifetime' ? [PRODUCT_IDS.lifetime] : [PRODUCT_IDS.yearly, PRODUCT_IDS.monthly];
    let mounted = true;
    IAP.getProducts(ids).then((p) => mounted && setProducts(p)).catch(() => {});
    return () => {
      mounted = false;
    };
  }, [visible, offer]);

  const priceFor = (id: string) => products.find((p) => p.id === id)?.displayPrice ?? '';

  async function buy(id: string) {
    setError(null);
    setBusy(id);
    try {
      const result = await IAP.purchase(id);
      if (result === 'purchased') {
        await refreshPro();
        onPurchased?.();
        onClose();
      } else if (result === 'pending') {
        setError('Purchase pending approval.');
      } else if (result !== 'cancelled') {
        setError('Purchase could not be completed.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    setError(null);
    setBusy('restore');
    try {
      await IAP.restore();
      const pro = await refreshPro();
      if (pro) {
        onPurchased?.();
        onClose();
      } else {
        setError('No purchases to restore.');
      }
    } catch {
      setError('Restore failed. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <YStack flex={1} bg="rgba(0,0,0,0.5)" justify="flex-end">
        <YStack bg="$background" borderTopLeftRadius={24} borderTopRightRadius={24} pt="$3" pb="$6" height="88%">
          <XStack justify="flex-end" px="$4">
            <Button size="$2" circular chromeless onPress={onClose} accessibilityLabel="Close">
              <MaterialCommunityIcons name="close" size={22} color="#888" />
            </Button>
          </XStack>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <YStack gap="$2" items="center" mb="$4">
              <Text fontSize={28} fontWeight="800" color="$color12">
                Waimea Pro
              </Text>
              <Text fontSize={15} color="$color10" text="center">
                Alarms anchored to any time zone, everywhere you go.
              </Text>
            </YStack>

            {/* Works-on-all-devices, highlighted */}
            <XStack
              items="center"
              gap="$3"
              bg="$blue3"
              borderColor="$blue7"
              borderWidth={1}
              rounded="$4"
              px="$4"
              py="$3"
              mb="$4"
            >
              <MaterialCommunityIcons name="devices" size={24} color="#3B82F6" />
              <YStack flex={1}>
                <Text fontSize={15} fontWeight="700" color="$color12">
                  Works on all your devices
                </Text>
                <Text fontSize={13} color="$color10">
                  Buy once — iPhone, iPad, and Apple Watch.
                </Text>
              </YStack>
            </XStack>

            <YStack gap="$2.5" mb="$5">
              {BENEFITS.map((b) => (
                <XStack key={b} items="center" gap="$3">
                  <MaterialCommunityIcons name="check-circle" size={20} color="#3B82F6" />
                  <Text fontSize={15} color="$color12" flex={1}>
                    {b}
                  </Text>
                </XStack>
              ))}
            </YStack>

            {error && (
              <Text fontSize={13} color="$red10" text="center" mb="$3">
                {error}
              </Text>
            )}

            {/* Offer buttons */}
            {offer === 'lifetime' && (
              <Button
                size="$5"
                bg="$blue9"
                onPress={() => buy(PRODUCT_IDS.lifetime)}
                disabled={busy != null}
                opacity={busy != null ? 0.6 : 1}
              >
                <Text color="white" fontSize={17} fontWeight="700">
                  {busy === PRODUCT_IDS.lifetime
                    ? 'Unlocking…'
                    : `Unlock Lifetime${priceFor(PRODUCT_IDS.lifetime) ? ` · ${priceFor(PRODUCT_IDS.lifetime)}` : ''}`}
                </Text>
              </Button>
            )}

            {offer === 'sub' && (
              <YStack gap="$3">
                <Button size="$5" bg="$blue9" onPress={() => buy(PRODUCT_IDS.yearly)} disabled={busy != null} opacity={busy != null ? 0.6 : 1}>
                  <Text color="white" fontSize={17} fontWeight="700">
                    {busy === PRODUCT_IDS.yearly ? 'Starting…' : `Yearly${priceFor(PRODUCT_IDS.yearly) ? ` · ${priceFor(PRODUCT_IDS.yearly)}` : ''}`}
                  </Text>
                </Button>
                <Button size="$4" bg="$color3" onPress={() => buy(PRODUCT_IDS.monthly)} disabled={busy != null} opacity={busy != null ? 0.6 : 1}>
                  <Text color="$color12" fontSize={15} fontWeight="600">
                    {busy === PRODUCT_IDS.monthly ? 'Starting…' : `Monthly${priceFor(PRODUCT_IDS.monthly) ? ` · ${priceFor(PRODUCT_IDS.monthly)}` : ''}`}
                  </Text>
                </Button>
                <Text fontSize={12} color="$color10" text="center">
                  Auto-renewing. Cancel anytime in Settings. Your subscription renews unless canceled at least 24 hours before the end of the period.
                </Text>
              </YStack>
            )}

            <Button size="$3" chromeless mt="$3" onPress={handleRestore} disabled={busy != null}>
              <Text fontSize={14} color="$blue10" fontWeight="600">
                {busy === 'restore' ? 'Restoring…' : 'Restore Purchases'}
              </Text>
            </Button>

            <XStack justify="center" gap="$4" mt="$3">
              <Text fontSize={12} color="$color9" onPress={() => Linking.openURL(TERMS_URL)}>
                Terms
              </Text>
              <Text fontSize={12} color="$color9" onPress={() => Linking.openURL(PRIVACY_URL)}>
                Privacy Policy
              </Text>
            </XStack>
          </ScrollView>
        </YStack>
      </YStack>
    </Modal>
  );
}
