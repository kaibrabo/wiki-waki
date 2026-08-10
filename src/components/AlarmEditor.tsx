import { useEffect, useState } from 'react';
import { Modal, Alert } from 'react-native';
import { ScrollView, YStack, XStack, Text, Input, Button, Card } from 'tamagui';
import { useStore } from '../store';
import { AppSwitch } from './AppSwitch';
import { getTranslations, translateLabel } from '../lib/i18n';
import type { Alarm, Recurrence } from '../types';

type RecType = 'daily' | 'weekdays' | 'once' | 'none' | 'custom';

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
  const language = useStore((s) => s.language);
  const lastAlarmSettings = useStore((s) => s.lastAlarmSettings);
  const setLastAlarmSettings = useStore((s) => s.setLastAlarmSettings);

  const t = getTranslations(language);
  
  const REPEAT_OPTIONS: { value: RecType; label: string; days?: number[] }[] = [
    { value: 'none', label: t.none },
    { value: 'daily', label: t.daily, days: [0, 1, 2, 3, 4, 5, 6] },
    { value: 'weekdays', label: t.weekdays, days: [1, 2, 3, 4, 5] },
    { value: 'once', label: t.once },
  ];

  const WEEKDAYS = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

  const [label, setLabel] = useState('');
  const [timeValue, setTimeValue] = useState('09:00');
  const [recType, setRecType] = useState<RecType>('weekdays');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [onceDate, setOnceDate] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingCustomLabel, setAddingCustomLabel] = useState(false);
  const [customLabelText, setCustomLabelText] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);

  const closeKeypad = () => {
    if (showKeypad) {
      // Clamp time values when closing keypad
      const [h, m] = timeValue.split(':').map(s => parseInt(s, 10));
      let hh = isNaN(h) ? 0 : h;
      let mm = isNaN(m) ? 0 : m;
      if (hh > 23) hh = 23;
      if (mm > 59) mm = 59;
      setTimeValue(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
      setShowKeypad(false);
    }
  };
  
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
      // Use last saved settings for new alarms
      setLabel(lastAlarmSettings.label);
      setTimeValue(lastAlarmSettings.time);
      setRecType(lastAlarmSettings.recType);
      setSelectedDays(lastAlarmSettings.selectedDays);
      setOnceDate('');
      setEnabled(true);
    }
    setError(null);
    setAddingCustomLabel(false);
    setCustomLabelText('');
  }, [visible, editing, lastAlarmSettings]);

  const save = () => {
    if (!label.trim()) return setError(t.selectLabel);
    
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
    
    // Save settings for next alarm
    setLastAlarmSettings({
      label: label.trim(),
      time: timeValue,
      recType,
      selectedDays,
    });
    
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
                {t.cancel}
              </Text>
            </Button>
            <Text fontSize={17} fontWeight="600" color="$color12">
              {editing ? t.editAlarm : t.newAlarm}
            </Text>
            <Button size="$3" chromeless onPress={save}>
              <Text color="$blue10" fontSize={17} fontWeight="700">
                {t.save}
              </Text>
            </Button>
          </XStack>

          <ScrollView keyboardShouldPersistTaps="handled" onScrollBeginDrag={closeKeypad}>
            <YStack pb={32} onPress={closeKeypad}>
              {/* Enabled toggle at top */}
              <XStack items="center" justify="space-between" px="$4" pt="$4" pb="$2" onPress={closeKeypad}>
                <Text color="$color12" fontSize={16} fontWeight="600">
                  {t.enabled}
                </Text>
                <AppSwitch value={enabled} onValueChange={(v) => { closeKeypad(); setEnabled(v); }} />
              </XStack>

              {/* Time Picker */}
              <TimeInput 
                value={timeValue} 
                onChange={setTimeValue} 
                use24Hour={use24Hour}
                showKeypad={showKeypad}
                onShowKeypad={() => setShowKeypad(true)}
                onCloseKeypad={closeKeypad}
              />

              {/* Label Picker */}
              <Field label={t.label} onPress={closeKeypad}>
                <XStack flexWrap="wrap" gap="$2">
                  {labelOptions.map((opt) => (
                    <Button
                      key={opt}
                      size="$3"
                      bg={label === opt ? '$blue9' : '$color3'}
                      onPress={() => { closeKeypad(); setLabel(opt); }}
                    >
                      <Text color={label === opt ? 'white' : '$color12'} fontWeight="600">
                        {translateLabel(opt, language)}
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
                        onFocus={closeKeypad}
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
              <Field label={t.repeat} onPress={closeKeypad}>
                <XStack flexWrap="wrap" gap="$2" mb="$3">
                  {REPEAT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      size="$3"
                      bg={recType === opt.value || (recType === 'custom' && opt.value !== 'none' && opt.value !== 'once') ? (recType === opt.value ? '$blue9' : '$color3') : '$color3'}
                      onPress={() => { closeKeypad(); selectPreset(opt.value); }}
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
                    onFocus={closeKeypad}
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
                        onPress={() => { closeKeypad(); toggleDay(i); }}
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
                    closeKeypad();
                    removeAlarm(editing.id);
                    onClose();
                  }}
                >
                  <Text color="$red10" fontSize={16} fontWeight="600">
                    {t.deleteAlarm}
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

function Field({ label, children, onPress }: { label: string; children: React.ReactNode; onPress?: () => void }) {
  return (
    <YStack px="$4" pt="$4.5" gap="$2" onPress={onPress}>
      <Text color="$color10" fontSize={13} fontWeight="700" textTransform="uppercase">
        {label}
      </Text>
      {children}
    </YStack>
  );
}

function TimeInput({ 
  value, 
  onChange, 
  use24Hour,
  showKeypad,
  onShowKeypad,
  onCloseKeypad,
}: { 
  value: string; 
  onChange: (v: string) => void;
  use24Hour: boolean;
  showKeypad: boolean;
  onShowKeypad: () => void;
  onCloseKeypad: () => void;
}) {
  // Parse current value into digits (4 digits: HHMM)
  const [h1, h2, m1, m2] = value.replace(':', '').padStart(4, '0').split('');
  const digits = [h1, h2, m1, m2];
  
  // Convert to 12-hour display if needed
  const hours24 = parseInt(h1 + h2, 10);
  const isPM = hours24 >= 12;
  const hours12 = hours24 % 12 || 12;
  const displayHours = use24Hour ? (h1 + h2) : String(hours12).padStart(2, '0');
  
  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      // Shift digits right (clear leftmost)
      const newDigits = ['0', digits[0], digits[1], digits[2]];
      const newValue = `${newDigits[0]}${newDigits[1]}:${newDigits[2]}${newDigits[3]}`;
      onChange(newValue);
    } else if (/^[0-9]$/.test(key)) {
      // Shift digits left and add new digit on right (no clamping during input)
      const newDigits = [digits[1], digits[2], digits[3], key];
      const newValue = `${newDigits[0]}${newDigits[1]}:${newDigits[2]}${newDigits[3]}`;
      onChange(newValue);
    }
  };

  const toggleAMPM = () => {
    let hh = parseInt(h1 + h2, 10);
    if (hh < 12) {
      hh += 12;
    } else {
      hh -= 12;
    }
    const newValue = `${String(hh).padStart(2, '0')}:${m1}${m2}`;
    onChange(newValue);
  };

  return (
    <YStack items="center" gap="$3" px="$4" pt="$4">
      {/* Time Display */}
      <XStack items="center" gap="$1">
        <XStack 
          bg="$color2" 
          rounded="$4" 
          px="$4" 
          py="$3"
          borderWidth={1}
          borderColor={showKeypad ? '$blue8' : '$borderColor'}
          pressStyle={{ bg: '$color3' }}
          onPress={onShowKeypad}
        >
          <Text fontSize={48} fontWeight="200" color="$color12">
            {displayHours}
          </Text>
        </XStack>
        <Text fontSize={48} fontWeight="200" color="$color10">:</Text>
        <XStack 
          bg="$color2" 
          rounded="$4" 
          px="$4" 
          py="$3"
          borderWidth={1}
          borderColor={showKeypad ? '$blue8' : '$borderColor'}
          pressStyle={{ bg: '$color3' }}
          onPress={onShowKeypad}
        >
          <Text fontSize={48} fontWeight="200" color="$color12">
            {m1}{m2}
          </Text>
        </XStack>
        {!use24Hour && (
          <XStack
            bg="$color3"
            rounded="$4"
            px="$3"
            py="$2"
            ml="$2"
            pressStyle={{ bg: '$color4' }}
            onPress={toggleAMPM}
          >
            <Text fontSize={20} fontWeight="600" color="$color12">
              {isPM ? 'PM' : 'AM'}
            </Text>
          </XStack>
        )}
      </XStack>

      {/* Numeric Keypad */}
      {showKeypad && (
        <YStack gap="$2" mt="$2">
          {[[1, 2, 3], [4, 5, 6], [7, 8, 9], ['✕', 0, '⌫']].map((row, i) => (
            <XStack key={i} gap="$2" justify="center">
              {row.map((key, j) => (
                <XStack
                  key={`${i}-${j}`}
                  width={70}
                  height={50}
                  rounded="$4"
                  bg="$color3"
                  items="center"
                  justify="center"
                  pressStyle={{ bg: '$color5' }}
                  onPress={() => {
                    if (key === '⌫') handleKeyPress('backspace');
                    else if (key === '✕') onCloseKeypad();
                    else handleKeyPress(String(key));
                  }}
                >
                  <Text fontSize={24} fontWeight="500" color={key === '✕' ? '$red10' : '$color12'}>
                    {key}
                  </Text>
                </XStack>
              ))}
            </XStack>
          ))}
        </YStack>
      )}
    </YStack>
  );
}
