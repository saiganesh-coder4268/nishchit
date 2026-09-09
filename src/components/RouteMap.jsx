import React, { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const icon = L.divIcon({ className: 'route-bus-marker', html: '<span aria-label="Bus">🚌</span>', iconSize: [42, 42], iconAnchor: [21, 21] });
function Follow({ position }) { const map = useMap(); useEffect(() => { if (position) map.panTo(position, { animate: true }); }, [map, position]); return null; }
export default function RouteMap({ location, route }) {
  const position = location ? [location.lat, location.lng] : route?.startPoint ? [route.startPoint.lat, route.startPoint.lng] : null;
  if (!position) return <div className="map-empty-state"><strong>Waiting for bus location</strong><p>The map will become available when your transport team configures the route and the driver starts a trip.</p></div>;
  return <MapContainer center={position} zoom={14} className="route-map" scrollWheelZoom><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{location && <Marker position={position} icon={icon}/>}<Follow position={location ? position : null}/></MapContainer>;
}
