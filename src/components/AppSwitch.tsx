import { XStack, Circle } from 'tamagui';

// A dependency-free switch. Tamagui's built-in Switch needs an animation driver
// (not configured here) for its thumb to move, so we position the thumb
// ourselves via justify — always correct, no animation driver required.
export function AppSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <XStack
      width={52}
      height={32}
      rounded={999}
      p={3}
      items="center"
      justify={value ? 'flex-end' : 'flex-start'}
      bg={value ? '$green9' : '$color6'}
      pressStyle={{ opacity: 0.8 }}
      cursor="pointer"
      onPress={() => onValueChange(!value)}
    >
      <Circle
        size={26}
        bg="white"
        shadowColor="black"
        shadowOpacity={0.2}
        shadowRadius={2}
        shadowOffset={{ width: 0, height: 1 }}
      />
    </XStack>
  );
}
