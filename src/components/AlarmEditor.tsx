import { useEffect, useState, useCallback } from 'react';
import { Modal, Alert } from 'react-native';
import { ScrollView, YStack, XStack, Text, Input, Button, Card } from 'tamagui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { AppSwitch } from './AppSwitch';
import { getTranslations, translateLabel } from '../lib/i18n';
import {
  SOUND_OPTIONS,
  DEFAULT_SOUND,
  coerceSound,
  previewSound,
  stopPreview,
} from '../lib/alarmSounds';
import type { Alarm, Recurrence, AlarmSound } from '../types';

type RecType = 'daily' | 'weekdays' | 'none' | 'custom' | 'monthly' | 'yearly';

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
    { value: 'monthly', label: t.monthly },
    { value: 'yearly', label: t.yearly },
  ];

  const WEEKDAYS = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

  const [label, setLabel] = useState('');
  const [timeValue, setTimeValue] = useState('09:00');
  const [recType, setRecType] = useState<RecType>('weekdays');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(1); // 1-31
  const [selectedMonth, setSelectedMonth] = useState(1); // 1-12
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingCustomLabel, setAddingCustomLabel] = useState(false);
  const [customLabelText, setCustomLabelText] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [sound, setSound] = useState<AlarmSound>(DEFAULT_SOUND);

  const closeKeypad = useCallback(() => {
    if (showKeypad) {
      // Normalize to 2-digit HH:mm (no clamping — an out-of-range value is
      // caught on save with a warning so the user can adjust it).
      const [h, m] = timeValue.split(':').map(s => parseInt(s, 10));
      const hh = isNaN(h) ? 0 : h;
      const mm = isNaN(m) ? 0 : m;
      setTimeValue(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
      setShowKeypad(false);
    }
  }, [showKeypad, timeValue]);

  // Pick a sound and immediately preview it.
  const selectSound = useCallback((next: AlarmSound) => {
    closeKeypad();
    setSound(next);
    previewSound(next);
  }, [closeKeypad]);

  // Release the preview player when the editor is dismissed.
  useEffect(() => {
    if (!visible) stopPreview();
  }, [visible]);


  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setLabel(editing.label);
      setTimeValue(editing.time);
      if (editing.recurrence.type === 'weekly') {
        // 'weekly' is how the editor persists both Weekdays and custom day sets
        // (see save()), so map it back to the right chip instead of always 'custom'.
        const days = editing.recurrence.days;
        const isWeekdays = days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d));
        const isDaily = days.length === 7;
        setRecType(isWeekdays ? 'weekdays' : isDaily ? 'daily' : 'custom');
        setSelectedDays(days);
      } else if (editing.recurrence.type === 'monthly') {
        setRecType('monthly');
        setSelectedDayOfMonth(editing.recurrence.dayOfMonth);
      } else if (editing.recurrence.type === 'yearly') {
        setRecType('yearly');
        setSelectedMonth(editing.recurrence.month);
        setSelectedDayOfMonth(editing.recurrence.dayOfMonth);
      } else if (editing.recurrence.type === 'daily') {
        setRecType('daily');
        setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      } else if (editing.recurrence.type === 'once') {
        // A one-time alarm maps back to the "None" repeat chip (save() stores
        // 'none' as a 'once' recurrence). Previously this wrongly showed Monthly.
        setRecType('none');
      } else {
        // weekdays
        setRecType('weekdays');
        setSelectedDays([1, 2, 3, 4, 5]);
      }
      setEnabled(editing.enabled);
      setSound(coerceSound(editing.sound));
    } else {
      // Use last saved settings for new alarms
      setLabel(lastAlarmSettings.label);
      setTimeValue(lastAlarmSettings.time);
      setRecType(lastAlarmSettings.recType as RecType);
      setSelectedDays(lastAlarmSettings.selectedDays);
      // Set default date to today
      const today = new Date();
      setSelectedDayOfMonth(today.getDate());
      setSelectedMonth(today.getMonth() + 1);
      setEnabled(true);
      setSound(coerceSound(lastAlarmSettings.sound));
    }
    setError(null);
    setTimeError(false);
    setAddingCustomLabel(false);
    setCustomLabelText('');
    setShowDatePicker(false);
  }, [visible, editing, lastAlarmSettings]);

  const save = () => {
    // Validate the time. A valid 24h time (00:00-23:59) also covers the 12h
    // max of 12:59, since any valid 24h value displays as <=12:59 in 12h mode.
    const [hh, mm] = timeValue.split(':').map((s) => parseInt(s, 10));
    const timeValid =
      !isNaN(hh) && !isNaN(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
    if (!timeValid) {
      setTimeError(true);
      setShowKeypad(true);
      Alert.alert(
        'Invalid time',
        use24Hour
          ? 'Please enter a time between 00:00 and 23:59.'
          : 'Please enter a time between 1:00 and 12:59.'
      );
      return;
    }
    setTimeError(false);

    if (!label.trim()) return setError(t.selectLabel);

    let recurrence: Recurrence;
    if (recType === 'monthly') {
      recurrence = { type: 'monthly', dayOfMonth: selectedDayOfMonth };
    } else if (recType === 'yearly') {
      recurrence = { type: 'yearly', month: selectedMonth, dayOfMonth: selectedDayOfMonth };
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
      sound,
    });

    const payload = { locationId, label: label.trim(), time: timeValue, pinnedZone: zone, recurrence, enabled, sound };
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
    // Show date picker for monthly/yearly
    if (preset === 'monthly' || preset === 'yearly') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
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
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent 
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <YStack flex={1} bg="rgba(0,0,0,0.5)" justify="flex-end">
        <YStack bg="$background" borderTopLeftRadius={24} borderTopRightRadius={24} pt="$3" height="92%">
          <XStack items="center" justify="space-between" px="$4" pb="$3" borderBottomWidth={1} borderColor="$borderColor">
            <Button 
              size="$3" 
              chromeless 
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t.cancel}
            >
              <Text color="$color10" fontSize={17}>
                {t.cancel}
              </Text>
            </Button>
            <Text 
              fontSize={17} 
              fontWeight="600" 
              color="$color12"
              accessibilityRole="header"
            >
              {editing ? t.editAlarm : t.newAlarm}
            </Text>
            <Button 
              size="$3" 
              chromeless 
              onPress={save}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t.save}
            >
              <Text color="$blue10" fontSize={17} fontWeight="700">
                {t.save}
              </Text>
            </Button>
          </XStack>

          <ScrollView keyboardShouldPersistTaps="handled" onScrollBeginDrag={closeKeypad}>
            <YStack pb={32} onPress={closeKeypad}>
              {/* Enabled toggle at top */}
              <XStack 
                items="center" 
                justify="space-between" 
                px="$4" 
                pt="$4" 
                pb="$2" 
                onPress={closeKeypad}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel={t.enabled}
                accessibilityState={{ checked: enabled }}
              >
                <Text color="$color12" fontSize={16} fontWeight="600">
                  {t.enabled}
                </Text>
                <AppSwitch value={enabled} onValueChange={(v) => { closeKeypad(); setEnabled(v); }} />
              </XStack>

              {/* Time Picker */}
              <TimeInput
                value={timeValue}
                onChange={(v) => { setTimeError(false); setTimeValue(v); }}
                use24Hour={use24Hour}
                showKeypad={showKeypad}
                error={timeError}
                onShowKeypad={() => { setTimeError(false); setShowKeypad(true); }}
                onCloseKeypad={closeKeypad}
              />

              {/* Label Picker */}
              <Field label={t.label} onPress={closeKeypad}>
                <XStack flexWrap="wrap" gap="$2" accessibilityRole="radiogroup">
                  {labelOptions.map((opt) => (
                    <Button
                      key={opt}
                      size="$3"
                      bg={label === opt ? '$blue9' : '$color3'}
                      onPress={() => { closeKeypad(); setLabel(opt); }}
                      accessible={true}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: label === opt }}
                      accessibilityLabel={translateLabel(opt, language)}
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
                        accessible={true}
                        accessibilityLabel="Custom label input"
                      />
                      <Button 
                        size="$3" 
                        bg="$blue9" 
                        onPress={handleAddCustomLabel}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Add custom label"
                      >
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
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Add custom label"
                    >
                      <Text color="$blue10" fontWeight="600">Add +</Text>
                    </Button>
                  )}
                </XStack>
              </Field>

              {/* Repeat Options */}
              <Field label={t.repeat} onPress={closeKeypad}>
                <XStack flexWrap="wrap" gap="$2" mb="$3" accessibilityRole="radiogroup">
                  {REPEAT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      size="$3"
                      bg={recType === opt.value ? '$blue9' : '$color3'}
                      onPress={() => { closeKeypad(); selectPreset(opt.value); }}
                      accessible={true}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: recType === opt.value }}
                      accessibilityLabel={opt.label}
                    >
                      <Text color={recType === opt.value ? 'white' : '$color12'} fontWeight="600">
                        {opt.label}
                      </Text>
                    </Button>
                  ))}
                </XStack>

                {/* Monthly - Day of month picker */}
                {recType === 'monthly' && (
                  <YStack gap="$2">
                    <Text color="$color10" fontSize={13}>Day of month</Text>
                    <YStack gap="$1.5">
                      {[0, 7, 14, 21, 28].map((rowStart) => (
                        <XStack key={rowStart} gap="$1.5">
                          {Array.from({ length: 7 }, (_, i) => rowStart + i + 1)
                            .filter(day => day <= 31)
                            .map((day) => (
                              <Button
                                key={day}
                                size="$2"
                                width={38}
                                height={38}
                                bg={selectedDayOfMonth === day ? '$blue9' : '$color3'}
                                onPress={() => { closeKeypad(); setSelectedDayOfMonth(day); }}
                                accessible={true}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: selectedDayOfMonth === day }}
                                accessibilityLabel={`Day ${day}`}
                              >
                                <Text
                                  fontSize={13}
                                  fontWeight="600"
                                  color={selectedDayOfMonth === day ? 'white' : '$color12'}
                                >
                                  {day}
                                </Text>
                              </Button>
                            ))}
                        </XStack>
                      ))}
                    </YStack>
                  </YStack>
                )}

                {/* Yearly - Month and day picker */}
                {recType === 'yearly' && (
                  <YStack gap="$3">
                    <YStack gap="$2">
                      <Text color="$color10" fontSize={13}>Month</Text>
                      <XStack flexWrap="wrap" gap="$1.5">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                          <Button
                            key={month}
                            size="$2"
                            px="$2"
                            bg={selectedMonth === i + 1 ? '$blue9' : '$color3'}
                            onPress={() => { closeKeypad(); setSelectedMonth(i + 1); }}
                            accessible={true}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: selectedMonth === i + 1 }}
                            accessibilityLabel={month}
                          >
                            <Text
                              fontSize={12}
                              fontWeight="600"
                              color={selectedMonth === i + 1 ? 'white' : '$color12'}
                            >
                              {month}
                            </Text>
                          </Button>
                        ))}
                      </XStack>
                    </YStack>
                    <YStack gap="$2">
                      <Text color="$color10" fontSize={13}>Day</Text>
                      <YStack gap="$1.5">
                        {[0, 7, 14, 21, 28].map((rowStart) => (
                          <XStack key={rowStart} gap="$1.5">
                            {Array.from({ length: 7 }, (_, i) => rowStart + i + 1)
                              .filter(day => day <= 31)
                              .map((day) => (
                                <Button
                                  key={day}
                                  size="$2"
                                  width={38}
                                  height={38}
                                  bg={selectedDayOfMonth === day ? '$blue9' : '$color3'}
                                  onPress={() => { closeKeypad(); setSelectedDayOfMonth(day); }}
                                  accessible={true}
                                  accessibilityRole="radio"
                                  accessibilityState={{ selected: selectedDayOfMonth === day }}
                                  accessibilityLabel={`Day ${day}`}
                                >
                                  <Text
                                    fontSize={13}
                                    fontWeight="600"
                                    color={selectedDayOfMonth === day ? 'white' : '$color12'}
                                  >
                                    {day}
                                  </Text>
                                </Button>
                              ))}
                          </XStack>
                        ))}
                      </YStack>
                    </YStack>
                  </YStack>
                )}

                {/* Weekly day selector */}
                {(recType === 'daily' || recType === 'weekdays' || recType === 'custom') && (
                  <XStack gap="$1.5" justify="space-between" accessible={true} accessibilityLabel="Select days of the week">
                    {WEEKDAYS.map((day, i) => (
                      <Button
                        key={`${day}-${i}`}
                        size="$3"
                        width={40}
                        bg={selectedDays.includes(i) ? '$blue9' : '$color3'}
                        onPress={() => { closeKeypad(); toggleDay(i); }}
                        accessible={true}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selectedDays.includes(i) }}
                        accessibilityLabel={day}
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

              {/* Sound Picker (tap to preview) */}
              <Field label={t.alarmSound} onPress={closeKeypad}>
                <XStack flexWrap="wrap" gap="$2" accessibilityRole="radiogroup">
                  {SOUND_OPTIONS.map((opt) => {
                    const selected = sound === opt.id;
                    return (
                      <Button
                        key={opt.id}
                        size="$3"
                        bg={selected ? '$blue9' : '$color3'}
                        onPress={() => selectSound(opt.id)}
                        accessible={true}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={opt.label}
                        accessibilityHint="Selects and previews this sound"
                      >
                        <Text color={selected ? 'white' : '$color12'} fontWeight="600">
                          {opt.label}
                        </Text>
                      </Button>
                    );
                  })}
                </XStack>
              </Field>

              {error && (
                <Text 
                  color="$red10" 
                  fontSize={13} 
                  px="$4" 
                  pt="$3.5"
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
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
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t.deleteAlarm}
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
  error,
  onShowKeypad,
  onCloseKeypad,
}: {
  value: string;
  onChange: (v: string) => void;
  use24Hour: boolean;
  showKeypad: boolean;
  error?: boolean;
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
      <XStack items="center" gap="$2">
        {/* Single fixed-size time container: HH : MM, colon centered between two
            fixed-width digit groups so it never shifts as the numbers change. */}
        <XStack
          bg="$color2"
          rounded="$4"
          px="$4"
          py="$3"
          items="center"
          borderWidth={error ? 2 : 1}
          borderColor={error ? '$red9' : showKeypad ? '$blue8' : '$borderColor'}
          pressStyle={{ bg: '$color3' }}
          onPress={onShowKeypad}
        >
          <Text fontSize={48} fontWeight="200" color="$color12" width={64} text="center" fontVariant={['tabular-nums']}>
            {displayHours}
          </Text>
          <Text fontSize={48} fontWeight="200" color="$color10" width={18} text="center">
            :
          </Text>
          <Text fontSize={48} fontWeight="200" color="$color12" width={64} text="center" fontVariant={['tabular-nums']}>
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
