import { USGS_QUERY_URL, type OrderBy } from '../lib/constants.js';

export interface EarthquakeFilters {
  minMagnitude: number;
  limit: number;
  dateEnabled: boolean;
  startTime?: string | null;
  endTime?: string | null;
  orderBy: OrderBy;
}

export interface Earthquake {
  id: string;
  mag: number;
  place: string;
  time: number;
  updated: number;
  longitude: number;
  latitude: number;
  depth: number;
  felt: number | null;
  sig: number;
  tsunami: number;
  magType: string | null;
  status: string | null;
  url: string;
  detail: string;
  hasShakemap: boolean;
}

export interface EarthquakeListResult {
  metadata: { count: number; generated: number; title: string };
  earthquakes: Earthquake[];
}

export interface ShakemapContourFeature {
  geometry: { coordinates: number[][][] };
  properties: { value?: number; weight: number; color: string };
}

export interface EarthquakeDetailResult {
  earthquake: Earthquake;
  contours: ShakemapContourFeature[];
}

interface UsgsFeature {
  id: string;
  geometry: { coordinates: [number, number, number] };
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    updated: number;
    url: string;
    detail: string;
    felt: number | null;
    sig: number;
    tsunami: number;
    magType: string | null;
    status: string | null;
    products?: {
      shakemap?: Array<{
        contents?: Record<string, { url: string }>;
      }>;
    };
  };
}

interface UsgsResponse {
  // The FDSNWS `query` endpoint omits `count` (unlike the summary feed), so we
  // derive it from the returned features.
  metadata: { generated: number; title: string };
  features: UsgsFeature[];
}

const getShakemapContentUrl = (feature: UsgsFeature): string | undefined =>
  feature.properties.products?.shakemap?.[0]?.contents?.['download/cont_mi.json']
    ?.url;

const normalizeFeature = (feature: UsgsFeature): Earthquake => {
  const { id, geometry, properties } = feature;
  const [longitude, latitude, depth] = geometry.coordinates;
  return {
    id,
    mag: properties.mag ?? 0,
    place: properties.place ?? 'Unknown location',
    time: properties.time,
    updated: properties.updated,
    longitude,
    latitude,
    depth,
    felt: properties.felt ?? null,
    sig: properties.sig,
    tsunami: properties.tsunami,
    magType: properties.magType,
    status: properties.status,
    url: properties.url,
    detail: properties.detail,
    hasShakemap: getShakemapContentUrl(feature) !== undefined,
  };
};

// Ported from src/api/fetchData.js — builds the USGS FDSNWS query URL.
export const buildQueryUrl = (filters: EarthquakeFilters): string => {
  const params = new URLSearchParams({
    format: 'geojson',
    minmagnitude: String(filters.minMagnitude),
    limit: String(filters.limit),
    orderby: filters.orderBy,
  });
  if (filters.dateEnabled && filters.startTime) {
    params.set('starttime', filters.startTime);
  }
  if (filters.dateEnabled && filters.endTime) {
    params.set('endtime', filters.endTime);
  }
  return `${USGS_QUERY_URL}?${params.toString()}`;
};

// Small in-memory cache so rapid refetches / multiple clients don't hammer USGS.
const cache = new Map<string, { at: number; value: EarthquakeListResult }>();
const CACHE_TTL_MS = 45_000;

export const fetchEarthquakes = async (
  filters: EarthquakeFilters,
): Promise<EarthquakeListResult> => {
  const url = buildQueryUrl(filters);
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`USGS request failed (${res.status})`);
  }
  const json = (await res.json()) as UsgsResponse;
  const result: EarthquakeListResult = {
    metadata: {
      count: json.features.length,
      generated: json.metadata.generated,
      title: json.metadata.title,
    },
    earthquakes: json.features.map(normalizeFeature),
  };
  cache.set(url, { at: Date.now(), value: result });
  return result;
};

export const fetchEarthquakeDetail = async (
  id: string,
): Promise<EarthquakeDetailResult> => {
  const res = await fetch(
    `${USGS_QUERY_URL}?format=geojson&eventid=${encodeURIComponent(id)}`,
  );
  if (!res.ok) {
    throw new Error(`USGS detail request failed (${res.status})`);
  }
  const feature = (await res.json()) as UsgsFeature;
  const earthquake = normalizeFeature(feature);

  let contours: ShakemapContourFeature[] = [];
  const contourUrl = getShakemapContentUrl(feature);
  if (contourUrl) {
    try {
      const contourRes = await fetch(contourUrl);
      if (contourRes.ok) {
        const contourJson = (await contourRes.json()) as {
          features: ShakemapContourFeature[];
        };
        contours = contourJson.features ?? [];
      }
    } catch {
      // ShakeMap contours are optional — ignore fetch failures.
    }
  }

  return { earthquake, contours };
};
