// Ported verbatim from src/lib/util/colorUtil.js — maps an earthquake magnitude
// to an RGB color (low = blue/green, high = red).

type RGB = [number, number, number];

const calcRed = (val: number, low: number, high: number): number => {
  const zeroLow = low + (1 * (high - low)) / 6;
  const zeroHigh = low + (high - low) / 2;
  const maxLow = low;
  const maxHigh = low + (2 * (high - low)) / 3;

  if (val >= zeroLow && val <= zeroHigh) return 0;
  if (val <= maxLow || val >= maxHigh) return 255;
  if (val > maxLow && val < zeroLow) {
    return ((zeroLow - val) / (zeroLow - maxLow)) * 255;
  }
  return Math.round(((val - zeroHigh) / (maxHigh - zeroHigh)) * 255);
};

const calcGreen = (val: number, low: number, high: number): number => {
  const zeroLow = low + (1 * (high - low)) / 6;
  const zeroHigh = low + (5 * (high - low)) / 6;
  const maxLow = low + (1 * (high - low)) / 3;
  const maxHigh = low + (2 * (high - low)) / 3;

  if (val <= zeroLow || val >= zeroHigh) return 0;
  if (val >= maxLow && val <= maxHigh) return 255;
  if (val > maxHigh && val < zeroHigh) {
    return ((zeroHigh - val) / (zeroHigh - maxHigh)) * 255;
  }
  return Math.round(((val - zeroLow) / (maxLow - zeroLow)) * 255);
};

const calcBlue = (val: number, low: number, high: number): number => {
  const zeroLow = low + (high - low) / 2;
  const zeroHigh = low + (5 * (high - low)) / 6;
  const maxLow = low + (high - low) / 3;
  const maxHigh = high;

  if (val >= zeroLow && val <= zeroHigh) return 0;
  if (val <= maxLow || val >= maxHigh) return 255;
  if (val > maxLow && val < zeroLow) {
    return ((zeroLow - val) / (zeroLow - maxLow)) * 255;
  }
  return Math.round(((val - zeroHigh) / (maxHigh - zeroHigh)) * 255);
};

export const getRGB = (val: number, low: number, high: number): RGB => [
  calcRed(val, low, high),
  calcGreen(val, low, high),
  calcBlue(val, low, high),
];

export const formatRGB = ([red, green, blue]: RGB): string =>
  `rgb(${red},${green},${blue})`;

export const formatRGBA = ([red, green, blue]: RGB, opacity: number): string =>
  `rgba(${red},${green},${blue},${opacity})`;

// Convenience: the app always colors quakes on a 1.0–9.5 magnitude scale.
export const magnitudeColor = (mag: number): string => formatRGB(getRGB(mag, 1.0, 9.5));
export const magnitudeColorRGB = (mag: number): RGB => getRGB(mag, 1.0, 9.5);
