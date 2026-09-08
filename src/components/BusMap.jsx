import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { ShieldCheck, Clock, MapPin, Bus } from 'lucide-react';
import { isValidCoordinate, calculateLocationFreshness } from '../utils/busStatus';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAdBCvhV_RinMaCyH0xs2yWYvFZ1t_rmCM";

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px'
};

// Create custom SVG bus marker icon for Google Maps using user provided school bus model
const getBusMarkerIcon = (isLive) => {
  const svg = `
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      ${isLive ? '<circle cx="30" cy="30" r="28" fill="#10b981" opacity="0.3"/>' : ''}
      <rect x="10" y="12" width="40" height="32" rx="6" fill="#FBC02D" stroke="#1B2A4A" stroke-width="2.5"/>
      <rect x="15" y="17" width="30" height="12" rx="3" fill="#1B2A4A"/>
      <rect x="12" y="31" width="6" height="8" rx="2" fill="#E8873A"/>
      <rect x="42" y="31" width="6" height="8" rx="2" fill="#E8873A"/>
      <rect x="10" y="40" width="40" height="5" rx="2" fill="#37474F"/>
      <circle cx="18" cy="47" r="6" fill="#1B1B1B" stroke="#1B2A4A" stroke-width="1.5"/>
      <circle cx="42" cy="47" r="6" fill="#1B1B1B" stroke="#1B2A4A" stroke-width="1.5"/>
    </svg>
  `;
  const hasMaps = typeof window !== 'undefined' && window.google && window.google.maps;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: hasMaps ? new window.google.maps.Size(60, 60) : undefined,
    anchor: hasMaps ? new window.google.maps.Point(30, 30) : undefined
  };
};


export default function BusMap({ busData }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // Continuous freshness ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const rawLat = Number(busData?.latitude);
  const rawLng = Number(busData?.longitude);
  const hasValidCoords = isValidCoordinate(rawLat, rawLng);

  const latitude = hasValidCoords ? rawLat : 17.4399; // Default Hyderabad fallback
  const longitude = hasValidCoords ? rawLng : 78.4983;
  const freshness = calculateLocationFreshness(busData, now);
  const tripStatus = busData?.status || 'NOT_STARTED';

  const isFreshLive = tripStatus === 'LIVE' && freshness === 'LIVE';
  const isStale = tripStatus === 'LIVE' && freshness === 'STALE';
  const isUnavailable = tripStatus === 'LIVE' && freshness === 'UNAVAILABLE';
  const isCompleted = tripStatus === 'COMPLETED';
  const isNotStarted = tripStatus === 'NOT_STARTED';

  const center = { lat: latitude, lng: longitude };

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Smoothly re-center Google Map when bus coordinates move
  useEffect(() => {
    if (map && latitude && longitude) {
      map.panTo({ lat: latitude, lng: longitude });
    }
  }, [map, latitude, longitude]);

  const formatTime = (ts) => {
    if (!ts) return 'No timestamp';
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

  const getStatusText = () => {
    if (isFreshLive) return '🟢 Live Google Maps Tracking';
    if (isStale) return '⚠️ Last Known Position (Location Stale)';
    if (isUnavailable) return '⚠️ Location Stream Interrupted';
    if (isCompleted) return '🏁 Trip Completed — Final Position';
    return '🅿️ Trip Not Started — Bus Parked';
  };

  const getStatusStyles = () => {
    if (isFreshLive) return { background: '#ecfdf5', color: '#065f46' };
    if (isStale) return { background: '#fffbeb', color: '#b45309' };
    if (isUnavailable) return { background: '#fef2f2', color: '#991b1b' };
    if (isCompleted) return { background: '#f1f5f9', color: '#334155' };
    return { background: '#f1f5f9', color: '#475569' };
  };

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
          icon={getBusMarkerIcon(isFreshLive)}
          onClick={() => setShowInfoWindow(!showInfoWindow)}
        >
          {showInfoWindow && (
            <InfoWindowF
              position={center}
              onCloseClick={() => setShowInfoWindow(false)}
            >
              <div className="popup-content" style={{ fontFamily: 'Inter, sans-serif', padding: '4px', minWidth: '210px' }}>
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
                </div>

                <div
                  className="popup-status"
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    ...getStatusStyles()
                  }}
                >
                  {getStatusText()}
                </div>
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      </GoogleMap>
    </div>
  );
}
