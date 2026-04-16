import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_COORDINATE = {
  lat: -6.2,
  lng: 106.816666,
};

function ClickPositionMarker({ value, onChange }) {
  useMapEvents({
    click(event) {
      onChange({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  if (!value) {
    return null;
  }

  return (
    <CircleMarker
      center={[value.lat, value.lng]}
      radius={8}
      pathOptions={{ color: '#0e7490', fillColor: '#22d3ee', fillOpacity: 0.7 }}
    />
  );
}

function RecenterMap({ value }) {
  const map = useMap();

  useEffect(() => {
    if (!value) {
      return;
    }

    map.setView([value.lat, value.lng], map.getZoom(), { animate: true });
  }, [map, value]);

  return null;
}

export default function MapPicker({ value, onChange }) {
  const center = value || DEFAULT_COORDINATE;

  return (
    <div className="h-64 w-full overflow-hidden rounded-2xl border border-cyan-100 shadow-sm">
      <MapContainer center={[center.lat, center.lng]} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap value={value} />
        <ClickPositionMarker value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
