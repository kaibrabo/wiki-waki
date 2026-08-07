import { useEffect, useState } from 'react';
import { Modal, Alert, Platform, TextInput as RNTextInput } from 'react-native';
import { ScrollView, YStack, XStack, Text, Input, Button, Card } from 'tamagui';
import { useStore } from '../store';
import { AppSwitch } from './AppSwitch';
import type { Alarm, Recurrence } from '../types';

type RecType = 'daily' | 'weekdays' | 'once' | 'none' | 'custom';

const REPEAT_OPTIONS: { value: RecType; label: string; days?: number[] }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily', days: [0, 1, 2, 3, 4, 5, 6] },
  { value: 'weekdays', label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { value: 'once', label: 'Once' },
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
  const labelOptions = useStore((s) => s.labelOptions);
  const addLabelOption = useStore((s) => s.addLabelOption);
  const use24Hour = useStore((s) => s.use24Hour);

  const [label, setLabel] = useState('');
  const [timeValue, setTimeValue] = useState('09:00');
  const [recType, setRecType] = useState<RecType>('weekdays');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [onceDate, setOnceDate] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingCustomLabel, setAddingCustomLabel] = useState(false);
  const [customLabelText, setCustomLabelText] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setLabel(editing.label);
      setTimeValue(editing.time);
      if (editing.recurrence.type === 'weekly') {
        setRecType('custom');
        setSelectedDays(editing.recurrence.days);
      } else if (editing.recurrence.type === 'once') {
        setRecType('once');
        setOnceDate(editing.recurrence.date);
      } else if (editing.recurrence.type === 'daily') {
        setRecType('daily');
        setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      } else {
        // weekdays
        setRecType('weekdays');
        setSelectedDays([1, 2, 3, 4, 5]);
      }
      setEnabled(editing.enabled);
    } else {
      setLabel('');
      setTimeValue('09:00');
      setRecType('weekdays');
      setSelectedDays([1, 2, 3, 4, 5]);
      setOnceDate('');
      setEnabled(true);
    }
    setError(null);
    setAddingCustomLabel(false);
    setCustomLabelText('');
  }, [visible, editing]);

  const save = () => {
    if (!label.trim()) return setError('Select a label');
    
    let recurrence: Recurrence;
    if (recType === 'once') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(onceDate.trim())) return setError('Date must be YYYY-MM-DD');
      recurrence = { type: 'once', date: onceDate.trim() };
    } else if (recType === 'custom') {
      if (selectedDays.length === 0) return setError('Select at least one day');
      recurrence = { type: 'weekly', days: selectedDays };
    } else if (recType === 'daily' || recType === 'weekdays') {
      // Use selected days which may have been customized
      if (selectedDays.length === 0) return setError('Select at least one day');
      if (selectedDays.length === 7) {
        recurrence = { type: 'daily' };
      } else {
        recurrence = { type: 'weekly', days: selectedDays };
      }
    } else if (recType === 'none') {
      // "None" = once with today's date, effectively a one-time alarm
      const today = new Date().toISOString().split('T')[0];
      recurrence = { type: 'once', date: today };
    } else {
      recurrence = { type: recType };
    }
    
    const payload = { locationId, label: label.trim(), time: timeValue, pinnedZone: zone, recurrence, enabled };
    if (editing) updateAlarm(editing.id, payload);
    else addAlarm(payload);
    onClose();
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const newDays = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort();
      // Switch to custom if days don't match presets
      const isDaily = newDays.length === 7;
      const isWeekdays = newDays.length === 5 && [1,2,3,4,5].every(d => newDays.includes(d));
      if (isDaily) setRecType('daily');
      else if (isWeekdays) setRecType('weekdays');
      else setRecType('custom');
      return newDays;
    });
  };

  const selectPreset = (preset: RecType) => {
    setRecType(preset);
    const option = REPEAT_OPTIONS.find(o => o.value === preset);
    if (option?.days) {
      setSelectedDays(option.days);
    }
  };

  const handleAddCustomLabel = () => {
    const trimmed = customLabelText.trim();
    if (trimmed) {
      addLabelOption(trimmed);
      setLabel(trimmed);
    }
    setAddingCustomLabel(false);
    setCustomLabelText('');
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
              {/* Enabled toggle at top */}
              <XStack items="center" justify="space-between" px="$4" pt="$4" pb="$2">
                <Text color="$color12" fontSize={16} fontWeight="600">
                  Enabled
                </Text>
                <AppSwitch value={enabled} onValueChange={setEnabled} />
              </XStack>

              {/* Time Picker */}
              <YStack px="$4" pt="$4" items="center">
                {Platform.OS === 'web' ? (
                  <RNTextInput
                    // @ts-expect-error - web-only type prop
                    type="time"
                    value={timeValue}
                    onChange={(e: any) => setTimeValue(e.target.value)}
                    style={{
                      fontSize: 48,
                      fontWeight: '200',
                      padding: 12,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#444',
                      backgroundColor: 'transparent',
                      color: 'inherit',
                      textAlign: 'center',
                      minWidth: 180,
                    }}
                  />
                ) : (
                  <Input
                    size="$6"
                    value={timeValue}
                    onChangeText={setTimeValue}
                    placeholder="HH:MM"
                    textAlign="center"
                    fontSize={32}
                  />
                )}
              </YStack>

              {/* Label Picker */}
              <Field label="Label">
                <XStack flexWrap="wrap" gap="$2">
                  {labelOptions.map((opt) => (
                    <Button
                      key={opt}
                      size="$3"
                      bg={label === opt ? '$blue9' : '$color3'}
                      onPress={() => setLabel(opt)}
                    >
                      <Text color={label === opt ? 'white' : '$color12'} fontWeight="600">
                        {opt}
                      </Text>
                    </Button>
                  ))}
                  {addingCustomLabel ? (
                    <XStack gap="$2" items="center">
                      <Input
                        size="$3"
                        width={120}
                        value={customLabelText}
                        onChangeText={setCustomLabelText}
                        placeholder="Label..."
                        autoFocus
                      />
                      <Button size="$3" bg="$blue9" onPress={handleAddCustomLabel}>
                        <Text color="white" fontWeight="600">Add</Text>
                      </Button>
                    </XStack>
                  ) : (
                    <Button
                      size="$3"
                      bg="$color3"
                      borderWidth={1}
                      borderColor="$blue8"
                      borderStyle="dashed"
                      onPress={() => setAddingCustomLabel(true)}
                    >
                      <Text color="$blue10" fontWeight="600">Add +</Text>
                    </Button>
                  )}
                </XStack>
              </Field>

              {/* Repeat Options */}
              <Field label="Repeat">
                <XStack flexWrap="wrap" gap="$2" mb="$3">
                  {REPEAT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      size="$3"
                      bg={recType === opt.value || (recType === 'custom' && opt.value !== 'none' && opt.value !== 'once') ? (recType === opt.value ? '$blue9' : '$color3') : '$color3'}
                      onPress={() => selectPreset(opt.value)}
                    >
                      <Text color={recType === opt.value ? 'white' : '$color12'} fontWeight="600">
                        {opt.label}
                      </Text>
                    </Button>
                  ))}
                </XStack>

                {recType === 'once' && (
                  <Input
                    size="$4"
                    value={onceDate}
                    onChangeText={setOnceDate}
                    placeholder="YYYY-MM-DD"
                  />
                )}

                {recType !== 'once' && recType !== 'none' && (
                  <XStack gap="$1.5" justify="space-between">
                    {WEEKDAYS.map((day, i) => (
                      <Button
                        key={`${day}-${i}`}
                        size="$3"
                        width={40}
                        bg={selectedDays.includes(i) ? '$blue9' : '$color3'}
                        onPress={() => toggleDay(i)}
                      >
                        <Text
                          fontSize={13}
                          fontWeight="700"
                          color={selectedDays.includes(i) ? 'white' : '$color12'}
                        >
                          {day}
                        </Text>
                      </Button>
                    ))}
                  </XStack>
                )}
              </Field>

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
