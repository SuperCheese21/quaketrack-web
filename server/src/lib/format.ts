import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import { TIMESTAMP_FORMAT } from './constants.js';

dayjs.extend(utc);

// Ported from src/lib/util/formatData.js
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
