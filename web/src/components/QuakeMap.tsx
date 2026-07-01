import type { GeoJsonObject } from 'geojson';
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
} from 'react-leaflet';
import { useNavigate } from 'react-router-dom';

import platesData from '../data/tectonic_plates.json';
import regionsData from '../data/tectonic_regions.json';
import { magnitudeColor } from '../lib/colorUtil';
import { formatMagnitude, formatTime } from '../lib/format';
import type { Earthquake } from '../trpc';

const plates = platesData as unknown as GeoJsonObject;
const regions = regionsData as unknown as GeoJsonObject;

// Marker radius grows with magnitude, roughly mirroring the mobile map.
const markerRadius = (mag: number): number => Math.max(4, mag * 2);

const QuakeMap = ({ quakes }: { quakes: Earthquake[] }) => {
  const navigate = useNavigate();

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      worldCopyJump
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Tectonic regions (red translucent) + plate boundaries (dark lines),
          ported from src/components/QuakesMapOverlay.js */}
      <GeoJSON
        data={regions}
        style={{ color: 'red', weight: 1, fillColor: 'red', fillOpacity: 0.1 }}
      />
      <GeoJSON
        data={plates}
        style={{ color: '#9ca3af', weight: 1.5, fill: false }}
      />

      {quakes.map((quake) => (
        <CircleMarker
          key={quake.id}
          center={[quake.latitude, quake.longitude]}
          radius={markerRadius(quake.mag)}
          pathOptions={{
            color: 'rgba(0,0,0,0.35)',
            weight: 1,
            fillColor: magnitudeColor(quake.mag),
            fillOpacity: 0.85,
          }}
        >
          <Popup>
            <div className="text-center">
              <div className="text-lg font-bold">
                M {formatMagnitude(quake.mag, 1)}
              </div>
              <div className="font-semibold">{quake.place}</div>
              <div className="text-xs opacity-70">{formatTime(quake.time)}</div>
              <button
                type="button"
                className="btn btn-primary btn-xs mt-2"
                onClick={() => navigate(`/quake/${encodeURIComponent(quake.id)}`)}
              >
                Details
              </button>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default QuakeMap;
