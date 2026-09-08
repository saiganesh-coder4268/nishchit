import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ShieldCheck, Clock, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet standard default icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Bus Marker HTML Icon
const createBusIcon = (isLive) => {
  return L.divIcon({
    className: 'custom-bus-icon',
    html: `
      <div class="bus-marker-container ${isLive ? 'live' : ''}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"/>
          <path d="M15 6v6"/>
          <path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4c-1.1 0-2.1.8-2.4 1.8l-1.4 5C.1 13.2 0 13.6 0 14c0 .4.1.8.2 1.2C.5 16.3 1 18 1 18h3"/>
          <circle cx="6.5" cy="17.5" r="2.5"/>
          <circle cx="16.5" cy="17.5" r="2.5"/>
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

// Component to dynamically re-center map when lat/lng changes
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (
      center && 
      Array.isArray(center) && 
      typeof center[0] === 'number' && 
      typeof center[1] === 'number' && 
      !isNaN(center[0]) && 
      !isNaN(center[1])
    ) {
      try {
        map.flyTo(center, 15, { duration: 1.5 });
      } catch (err) {
        console.warn("Map flyTo error:", err);
      }
    }
  }, [center, map]);
  return null;
}

export default function BusMap({ busData }) {
  const rawLat = Number(busData?.latitude);
  const rawLng = Number(busData?.longitude);

  const latitude = (!isNaN(rawLat) && rawLat !== 0) ? rawLat : 17.4399; // Default Hyderabad coordinates
  const longitude = (!isNaN(rawLng) && rawLng !== 0) ? rawLng : 78.4983;
  const isLive = busData?.status === 'LIVE';
  const position = [latitude, longitude];

  const busIcon = createBusIcon(isLive);

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bus-map-wrapper">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        className="leaflet-map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={position} />

        <Marker position={position} icon={busIcon}>
          <Popup className="bus-popup">
            <div className="popup-content">
              <div className="popup-header">
                <strong>{busData?.busNumber || 'Bus 24'}</strong>
                <span className="popup-route">{busData?.routeNumber || 'Route 04'}</span>
              </div>
              
              <div className="popup-details">
                <div className="popup-item">
                  <ShieldCheck size={14} color="#10b981" />
                  <span>Driver: <strong>{busData?.driverName || 'Rajesh Kumar'}</strong></span>
                </div>

                <div className="popup-item">
                  <Clock size={14} color="#64748b" />
                  <span>Last Updated: <strong>{formatTime(busData?.lastUpdated)}</strong></span>
                </div>

                <div className="popup-item">
                  <MapPin size={14} color="#2563eb" />
                  <span>Coords: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                </div>
              </div>

              {isLive ? (
                <div className="popup-status live">🟢 Live Geolocation Syncing</div>
              ) : (
                <div className="popup-status offline">Last Known Position</div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
