import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { ShieldCheck, Clock, MapPin, Bus } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAdBCvhV_RinMaCyH0xs2yWYvFZ1t_rmCM";

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px'
};

// Create custom SVG bus marker icon for Google Maps
const getBusMarkerIcon = (isLive) => {
  const color = isLive ? '#10b981' : '#2563eb';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="20" fill="${color}" stroke="#ffffff" stroke-width="3" />
      <circle cx="22" cy="22" r="21" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
      <g transform="translate(10, 10) scale(1)">
        <path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4c-1.1 0-2.1.8-2.4 1.8l-1.4 5C.1 13.2 0 13.6 0 14c0 .4.1.8.2 1.2C.5 16.3 1 18 1 18h3" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="6.5" cy="17.5" r="2" fill="#ffffff"/>
        <circle cx="16.5" cy="17.5" r="2" fill="#ffffff"/>
      </g>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: window.google ? new window.google.maps.Size(44, 44) : null,
    anchor: window.google ? new window.google.maps.Point(22, 22) : null
  };
};

export default function BusMap({ busData }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(true);

  const rawLat = Number(busData?.latitude);
  const rawLng = Number(busData?.longitude);

  const latitude = (!isNaN(rawLat) && rawLat !== 0) ? rawLat : 17.4399; // Default Hyderabad coordinates
  const longitude = (!isNaN(rawLng) && rawLng !== 0) ? rawLng : 78.4983;
  const isLive = busData?.status === 'LIVE';
  const center = { lat: latitude, lng: longitude };

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Smoothly re-center Google Map when bus moves
  useEffect(() => {
    if (map && center.lat && center.lng) {
      map.panTo(center);
    }
  }, [map, latitude, longitude]);

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loadError) {
    return (
      <div className="bus-map-wrapper flex-center" style={{ padding: '40px', textAlign: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#dc2626', fontWeight: 600 }}>Google Maps loading error. Please check internet connection or API key credentials.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bus-map-wrapper flex-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '420px', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <Bus size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
          <p>Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bus-map-wrapper">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
        }}
      >
        <MarkerF
          position={center}
          icon={getBusMarkerIcon(isLive)}
          onClick={() => setShowInfoWindow(!showInfoWindow)}
        >
          {showInfoWindow && (
            <InfoWindowF
              position={center}
              onCloseClick={() => setShowInfoWindow(false)}
            >
              <div className="popup-content" style={{ fontFamily: 'Inter, sans-serif', padding: '4px', minWidth: '200px' }}>
                <div className="popup-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{busData?.busNumber || 'Bus 24'}</strong>
                  <span className="popup-route" style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {busData?.routeNumber || 'Route 04'}
                  </span>
                </div>
                
                <div className="popup-details" style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="popup-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#10b981" />
                    <span>Driver: <strong>{busData?.driverName || 'Rajesh Kumar'}</strong></span>
                  </div>

                  <div className="popup-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#64748b" />
                    <span>Last Updated: <strong>{formatTime(busData?.lastUpdated)}</strong></span>
                  </div>

                  <div className="popup-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#2563eb" />
                    <span>Coords: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                  </div>
                </div>

                <div className="popup-status" style={{ marginTop: '8px', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', background: isLive ? '#ecfdf5' : '#f1f5f9', color: isLive ? '#065f46' : '#64748b' }}>
                  {isLive ? '🟢 Live Google Maps Tracking' : 'Bus Parked / Last Position'}
                </div>
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      </GoogleMap>
    </div>
  );
}
