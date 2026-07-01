import dayjs from 'dayjs';

export type OrderBy = 'time' | 'time-asc' | 'magnitude' | 'magnitude-asc';

export interface Filters {
  minMagnitude: number;
  limit: number;
  dateEnabled: boolean;
  startTime: string; // YYYY-MM-DD
  endTime: string; // YYYY-MM-DD
  orderBy: OrderBy;
}

// Ported from src/config/constants.js DEFAULT_FILTERS
export const DEFAULT_FILTERS: Filters = {
  minMagnitude: 4,
  limit: 1000,
  dateEnabled: false,
  startTime: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
  endTime: dayjs().format('YYYY-MM-DD'),
  orderBy: 'time',
};

export const LIMIT_OPTIONS = [10, 50, 100, 500, 1000] as const;

export const ORDER_BY_OPTIONS: Array<{ value: OrderBy; label: string }> = [
  { value: 'time', label: 'Time (descending)' },
  { value: 'time-asc', label: 'Time (ascending)' },
  { value: 'magnitude', label: 'Magnitude (descending)' },
  { value: 'magnitude-asc', label: 'Magnitude (ascending)' },
];

// Notification settings ranges (from src/screens/Notifications.js)
export const NOTIFICATION_MIN_MAG = 2;
export const NOTIFICATION_MAX_MAG = 8;
export const NOTIFICATION_MAG_STEP = 0.5;

export interface NotificationSettings {
  enabled: boolean;
  minMagnitude: number;
  updates: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  minMagnitude: 5,
  updates: false,
};
