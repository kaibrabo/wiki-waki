import { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import { ScrollView, YStack, XStack, Text, Input, Button, Card } from 'tamagui';
import { useStore } from '../store';
import { AppSwitch } from './AppSwitch';
import type { Alarm, Recurrence } from '../types';

type RecType = 'daily' | 'weekdays' | 'once';

function normalizeTime(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function AlarmEditor({
  visible,
  onClose,
  editing,
  locationId,
  zone,
  locationName,
}: {
  visible: boolean;
  onClose: () => void;
  editing: Alarm | null;
  locationId: string;
  zone: string;
  locationName: string;
}) {
  const addAlarm = useStore((s) => s.addAlarm);
  const updateAlarm = useStore((s) => s.updateAlarm);
  const removeAlarm = useStore((s) => s.removeAlarm);

  const [label, setLabel] = useState('');
  const [time, setTime] = useState('09:00');
  const [recType, setRecType] = useState<RecType>('weekdays');
  const [onceDate, setOnceDate] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setLabel(editing.label);
      setTime(editing.time);
      setRecType(editing.recurrence.type === 'weekly' ? 'daily' : editing.recurrence.type);
      setOnceDate(editing.recurrence.type === 'once' ? editing.recurrence.date : '');
      setEnabled(editing.enabled);
    } else {
      setLabel('');
      setTime('09:00');
      setRecType('weekdays');
      setOnceDate('');
      setEnabled(true);
    }
    setError(null);
  }, [visible, editing]);

  const save = () => {
    const t = normalizeTime(time);
    if (!t) return setError('Time must be HH:MM (24-hour), e.g. 09:00');
    if (!label.trim()) return setError('Give the alarm a label');
    let recurrence: Recurrence;
    if (recType === 'once') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(onceDate.trim())) return setError('Date must be YYYY-MM-DD');
      recurrence = { type: 'once', date: onceDate.trim() };
    } else {
      recurrence = { type: recType };
    }
    const payload = { locationId, label: label.trim(), time: t, pinnedZone: zone, recurrence, enabled };
    if (editing) updateAlarm(editing.id, payload);
    else addAlarm(payload);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <YStack flex={1} bg="rgba(0,0,0,0.5)" justify="flex-end">
        <YStack bg="$background" borderTopLeftRadius={24} borderTopRightRadius={24} pt="$3" height="92%">
          <XStack items="center" justify="space-between" px="$4" pb="$3" borderBottomWidth={1} borderColor="$borderColor">
            <Button size="$3" chromeless onPress={onClose}>
              <Text color="$color10" fontSize={17}>
                Cancel
              </Text>
            </Button>
            <Text fontSize={17} fontWeight="600" color="$color12">
              {editing ? 'Edit Alarm' : 'New Alarm'}
            </Text>
            <Button size="$3" chromeless onPress={save}>
              <Text color="$blue10" fontSize={17} fontWeight="700">
                Save
              </Text>
            </Button>
          </XStack>

          <ScrollView keyboardShouldPersistTaps="handled">
            <YStack pb={32}>
            <Text color="$color10" fontSize={13} lineHeight={18} px="$4" pt="$4">
              Alarm for {locationName}. It rings at this time in {locationName} — wherever you are.
            </Text>

            <Field label="Label">
              <Input size="$4" value={label} onChangeText={setLabel} placeholder="Start work" />
            </Field>

            <Field label={`Time in ${locationName} (24-hour)`}>
              <Input
                size="$4"
                value={time}
                onChangeText={setTime}
                placeholder="09:00"
                keyboardType="numbers-and-punctuation"
              />
            </Field>

            <Field label="Repeat">
              <XStack bg="$color2" rounded="$4" p="$1" gap="$1">
                {(['daily', 'weekdays', 'once'] as RecType[]).map((r) => (
                  <Button
                    key={r}
                    flex={1}
                    size="$3"
                    chromeless
                    bg={recType === r ? '$color5' : 'transparent'}
                    onPress={() => setRecType(r)}
                  >
                    <Text fontSize={14} fontWeight="600" color={recType === r ? '$color12' : '$color10'}>
                      {r === 'daily' ? 'Every day' : r === 'weekdays' ? 'Weekdays' : 'Once'}
                    </Text>
                  </Button>
                ))}
              </XStack>
              {recType === 'once' && (
                <Input
                  mt="$2.5"
                  size="$4"
                  value={onceDate}
                  onChangeText={setOnceDate}
                  placeholder="YYYY-MM-DD"
                />
              )}
            </Field>

            <XStack items="center" justify="space-between" px="$4" pt="$5">
              <Text color="$color12" fontSize={16}>
                Enabled
              </Text>
              <AppSwitch value={enabled} onValueChange={setEnabled} />
            </XStack>

            {error && (
              <Text color="$red10" fontSize={13} px="$4" pt="$3.5">
                {error}
              </Text>
            )}

            {editing && (
              <Button
                mx="$4"
                mt="$7"
                size="$4"
                bg="$color2"
                onPress={() => {
                  removeAlarm(editing.id);
                  onClose();
                }}
              >
                <Text color="$red10" fontSize={16} fontWeight="600">
                  Delete Alarm
                </Text>
              </Button>
            )}
            </YStack>
          </ScrollView>
        </YStack>
      </YStack>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <YStack px="$4" pt="$4.5" gap="$2">
      <Text color="$color10" fontSize={13} fontWeight="700" textTransform="uppercase">
        {label}
      </Text>
      {children}
    </YStack>
  );
}
