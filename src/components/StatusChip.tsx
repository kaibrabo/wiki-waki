import { XStack, Circle, Text } from 'tamagui';
import type { WorkStatus } from '../types';
import { statusToken, statusLabel } from '../theme';

export function StatusChip({ status }: { status: WorkStatus }) {
  const color = statusToken[status] as any;
  return (
    <XStack items="center" gap="$1.5" px="$2.5" py="$1" rounded="$10" bg="$color3" self="flex-start">
      <Circle size={7} bg={color} />
      <Text fontSize={12} fontWeight="600" color={color}>
        {statusLabel[status]}
      </Text>
    </XStack>
  );
}
