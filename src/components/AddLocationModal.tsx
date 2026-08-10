import { useMemo, useState } from 'react';
import { Modal } from 'react-native';
import { ScrollView, YStack, XStack, Text, Input, Button, Card } from 'tamagui';
import { DateTime } from 'luxon';
import { useStore } from '../store';
import { searchZones } from '../lib/zones';
import { getTranslations } from '../lib/i18n';

export function AddLocationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const locations = useStore((s) => s.locations);
  const addLocation = useStore((s) => s.addLocation);
  const language = useStore((s) => s.language);
  const use24Hour = useStore((s) => s.use24Hour);
  const [query, setQuery] = useState('');

  const t = getTranslations(language);
  const taken = new Set(locations.map((l) => l.name));
  const options = useMemo(() => {
    return searchZones(query).filter((z) => !taken.has(z.label));
  }, [query, taken]);

  const now = DateTime.now();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <YStack flex={1} bg="rgba(0,0,0,0.5)" justify="flex-end">
        <YStack bg="$background" borderTopLeftRadius={24} borderTopRightRadius={24} pt="$3" height="85%">
          <XStack items="center" justify="space-between" px="$4" pb="$3">
            <Text fontSize={20} fontWeight="800" color="$color12">
              {t.addLocation}
            </Text>
            <Button size="$3" chromeless onPress={onClose}>
              <Text color="$blue10" fontSize={17} fontWeight="600">
                {t.done}
              </Text>
            </Button>
          </XStack>

          <Input
            mx="$4"
            mb="$2"
            size="$4"
            value={query}
            onChangeText={setQuery}
            placeholder="Search city, zipcode, or airport code..."
            autoFocus
          />

          <ScrollView flex={1} keyboardShouldPersistTaps="handled">
            {options.map((z) => (
              <Card
                key={z.label}
                bg="transparent"
                px="$4"
                py="$3"
                pressStyle={{ bg: '$color3' }}
                onPress={() => {
                  addLocation(z.label, z.zone);
                  setQuery('');
                  onClose();
                }}
              >
                <XStack items="center" gap="$3">
                  <YStack flex={1} gap="$1">
                    <XStack items="center" flexWrap="wrap" gap="$1.5">
                      <Text fontSize={16} color="$color12">
                        {z.label}
                      </Text>
                      {z.codes?.map((c) => (
                        <XStack key={c} bg="$color4" px="$1.5" py={1} rounded="$2">
                          <Text fontSize={10} fontWeight="700" color="$color10">
                            {c}
                          </Text>
                        </XStack>
                      ))}
                    </XStack>
                    <Text fontSize={12} color="$color10">
                      {z.zone}
                    </Text>
                  </YStack>
                  <Text fontSize={15} color="$color10">
                    {now.setZone(z.zone).toFormat(use24Hour ? 'HH:mm' : 'h:mm a')}
                  </Text>
                </XStack>
              </Card>
            ))}
            {options.length === 0 && (
              <Text color="$color10" text="center" p="$6">
                No matches
              </Text>
            )}
          </ScrollView>
        </YStack>
      </YStack>
    </Modal>
  );
}
