import { CircleMarker, MapContainer, Polyline, TileLayer } from 'react-leaflet';

import { magnitudeColor } from '../lib/colorUtil';
import { CARTO_ATTRIBUTION, cartoTileUrl } from '../lib/mapTheme';
import { useTheme } from '../lib/useTheme';
import type { EarthquakeDetail } from '../trpc';

// Web port of src/components/ShakeMap.js + ShakeMapOverlay.js — a focused map
// with the USGS ShakeMap intensity contour lines drawn over it.
const ShakeMap = ({ detail }: { detail: EarthquakeDetail }) => {
  const { earthquake, contours } = detail;
  const center: [number, number] = [earthquake.latitude, earthquake.longitude];
  const { isDark } = useTheme();

  return (
    <MapContainer center={center} zoom={6} className="h-full w-full rounded-lg">
      <TileLayer
        key={isDark ? 'dark' : 'light'}
        attribution={CARTO_ATTRIBUTION}
        url={cartoTileUrl(isDark)}
      />

      {contours.flatMap((feature, featureIndex) =>
        feature.geometry.coordinates.map((line, lineIndex) => (
          <Polyline
            key={`${featureIndex}-${lineIndex}`}
            positions={line.map(
              ([lon, lat]) => [lat, lon] as [number, number],
            )}
            pathOptions={{
              color: feature.properties.color,
              weight: feature.properties.weight / 2,
            }}
          />
        )),
      )}

      <CircleMarker
        center={center}
        radius={8}
        pathOptions={{
          color: '#000',
          weight: 2,
          fillColor: magnitudeColor(earthquake.mag),
          fillOpacity: 1,
        }}
      />
    </MapContainer>
  );
};

export default ShakeMap;
