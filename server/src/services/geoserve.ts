import {
  ARC_LENGTH,
  CARDINAL_DIRECTIONS,
  COUNTRIES_TO_DISPLAY_STATES,
  NUM_DEGREES,
  USGS_GEOSERVE_PLACES,
  USGS_GEOSERVE_REGIONS,
} from '../lib/constants.js';

// All ported from quaketrack-server/src/handler.js.

// Minimum population of a city to be worth naming on a notification.
const getMinPopulation = (mag: number): number =>
  Math.round(13.5081 * Math.E ** (1.16879 * mag));

// Estimated farthest distance (km) from the epicenter where a quake is felt.
const getEarthquakeRangeKm = (mag: number): number =>
  20 * Math.E ** (0.536479 * mag) - 50;

const getDirection = (azimuth: number): string => {
  const corrected =
    ((azimuth % NUM_DEGREES) + (NUM_DEGREES + ARC_LENGTH) / 2) % NUM_DEGREES;
  return CARDINAL_DIRECTIONS[Math.floor(corrected / ARC_LENGTH)];
};

interface PlaceProperties {
  name: string;
  admin1_code: string;
  country_name: string;
  distance: number;
  azimuth: number;
}

const getPlace = async ({
  lat,
  lon,
  mag,
}: {
  lat: number;
  lon: number;
  mag: number;
}): Promise<PlaceProperties | undefined> => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    maxradiuskm: String(getEarthquakeRangeKm(mag)),
    type: 'geonames',
    minpopulation: String(getMinPopulation(mag)),
    limit: '1',
  });
  try {
    const res = await fetch(`${USGS_GEOSERVE_PLACES}?${params.toString()}`);
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      geonames?: { features: Array<{ properties: PlaceProperties }> };
    };
    return data.geonames?.features?.[0]?.properties;
  } catch {
    return undefined;
  }
};

const getRegion = async ({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}): Promise<string | undefined> => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    type: 'fe',
  });
  try {
    const res = await fetch(`${USGS_GEOSERVE_REGIONS}?${params.toString()}`);
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      fe?: { features: Array<{ properties: { name: string } }> };
    };
    return data.fe?.features?.[0]?.properties?.name;
  } catch {
    return undefined;
  }
};

/**
 * Human-readable location string for a notification. USGS list features already
 * carry a good `place` string, so callers pass that as the fast fallback; this
 * only reaches out to Geoserve when no place is available.
 */
export const describeLocation = async ({
  lat,
  lon,
  mag,
  fallbackPlace,
}: {
  lat: number;
  lon: number;
  mag: number;
  fallbackPlace?: string | null;
}): Promise<string> => {
  if (fallbackPlace) return fallbackPlace;

  const place = await getPlace({ lat, lon, mag });
  if (place) {
    const abbrev = COUNTRIES_TO_DISPLAY_STATES.includes(place.country_name)
      ? place.admin1_code
      : place.country_name;
    return `${Math.round(place.distance)} km ${getDirection(place.azimuth)} of ${place.name}, ${abbrev}`;
  }

  const region = await getRegion({ lat, lon });
  return region ?? 'Unknown location';
};
