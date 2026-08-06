// Status → Tamagui theme tokens (adapt automatically to light/dark) and labels.
import type { WorkStatus } from './types';

export const statusToken: Record<WorkStatus, string> = {
  working: '$green10',
  lunch: '$orange10',
  off: '$color10',
};

export const statusLabel: Record<WorkStatus, string> = {
  working: 'Working',
  lunch: 'Lunch',
  off: 'Off',
};
