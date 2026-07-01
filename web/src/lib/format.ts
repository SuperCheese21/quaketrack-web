import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

// Ported from src/lib/util/formatData.js
dayjs.extend(utc);
dayjs.extend(relativeTime);

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm UTC';

export const formatTime = (time: number | string): string =>
  dayjs.utc(time).format(TIMESTAMP_FORMAT);

const checkZeros = (n: number): string =>
  n - Math.round(n) === 0 ? `${n}.0` : `${n}`;

const precisionRound = (value: number, precision: number): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const formatMagnitude = (mag: number, precision: number): string =>
  checkZeros(precisionRound(mag, precision));

// "Updated 3 minutes ago" style label for the list header.
export const formatRelative = (time: number | string): string =>
  dayjs(time).fromNow();
