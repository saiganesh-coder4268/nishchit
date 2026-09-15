import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF, InfoWindowF } from '@react-google-maps/api';
import { ShieldCheck, Clock, Bus, MapPin, ChevronLeft, Crosshair, Navigation } from 'lucide-react';
import { isValidCoordinate, calculateLocationFreshness } from '../utils/busStatus';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAdBCvhV_RinMaCyH0xs2yWYvFZ1t_rmCM';

const containerStyle = {
  width: '100%',
  height: '100%',
  position: 'relative'
};

// Subtle modern transit map styling
const transitMapOptions = {
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  zoomControl: false,
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit.station', stylers: [{ visibility: 'on' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c4e0f9' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eef6ec' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
  ]
};

// Custom Stop Marker Icons with clean white pill labels
const getStopMarkerIcon = (stop, index, totalStops) => {
  const isOrigin = index === 0;
  const isDestination = index === totalStops - 1;
  const stopName = (stop.name || `Stop ${index + 1}`).replace(/'/g, '');
  const time = stop.scheduledTime || '';

  let svg = '';

  if (isOrigin) {
    svg = `
      <svg width="190" height="64" viewBox="0 0 190 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pillsd" x="-10%" y="-10%" width="125%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.16"/>
          </filter>
        </defs>
        <rect x="36" y="8" width="146" height="34" rx="8" fill="#FFFFFF" filter="url(#pillsd)"/>
        <text x="46" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="11" font-weight="700" fill="#0F172A">${stopName.slice(0, 18)}</text>
        <text x="46" y="35" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="10" font-weight="600" fill="#2563EB">${time}</text>
        <circle cx="20" cy="25" r="14" fill="#2563EB" stroke="#FFFFFF" stroke-width="3" filter="url(#pillsd)"/>
        <path d="M13 24 L20 20 L27 24 L20 28 Z" fill="#FFFFFF"/>
        <path d="M16 26 L16 29 C16 30.5 20 31.5 20 31.5 C20 31.5 24 30.5 24 29 L24 26" stroke="#FFFFFF" stroke-width="1.3" fill="none"/>
      </svg>
    `;
  } else if (isDestination) {
    svg = `
      <svg width="190" height="64" viewBox="0 0 190 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pillsd" x="-10%" y="-10%" width="125%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.16"/>
          </filter>
        </defs>
        <rect x="36" y="8" width="146" height="34" rx="8" fill="#FFFFFF" filter="url(#pillsd)"/>
        <text x="46" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="11" font-weight="700" fill="#0F172A">${stopName.slice(0, 18)}</text>
        <text x="46" y="35" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="10" font-weight="700" fill="#DC2626">${time} (ETA)</text>
        <circle cx="20" cy="25" r="14" fill="#DC2626" stroke="#FFFFFF" stroke-width="3" filter="url(#pillsd)"/>
        <path d="M15 26 L20 21 L25 26 V30 H15 Z" fill="#FFFFFF"/>
      </svg>
    `;
  } else {
    svg = `
      <svg width="170" height="56" viewBox="0 0 170 56" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pillsd" x="-10%" y="-10%" width="125%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.14"/>
          </filter>
        </defs>
        <rect x="28" y="7" width="134" height="30" rx="7" fill="#FFFFFF" filter="url(#pillsd)"/>
        <text x="36" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="11" font-weight="700" fill="#0F172A">${stopName.slice(0, 17)}</text>
        <text x="36" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="10" font-weight="500" fill="#64748B">${time}</text>
        <circle cx="16" cy="22" r="7.5" fill="#FFFFFF" stroke="#2563EB" stroke-width="3.5" filter="url(#pillsd)"/>
      </svg>
    `;
  }

  const hasMaps = typeof window !== 'undefined' && window.google && window.google.maps;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: hasMaps ? new window.google.maps.Size(isOrigin || isDestination ? 190 : 170, isOrigin || isDestination ? 64 : 56) : undefined,
    anchor: hasMaps ? new window.google.maps.Point(20, 25) : undefined
  };
};

// 3D Yellow School Bus Marker with Soft Radar Wave
const getYellowBusMarkerIcon = (isLive) => {
  const svg = `
    <svg width="90" height="90" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bshad" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      ${isLive ? `
        <circle cx="45" cy="45" r="42" fill="#93C5FD" opacity="0.25"/>
        <circle cx="45" cy="45" r="30" fill="#3B82F6" opacity="0.2"/>
        <circle cx="45" cy="45" r="22" fill="#1D4ED8" opacity="0.15"/>
      ` : ''}
      <g transform="translate(23, 23)" filter="url(#bshad)">
        <!-- Bus Body -->
        <rect x="2" y="4" width="40" height="34" rx="7" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
        <!-- Windshield -->
        <rect x="6" y="7" width="32" height="13" rx="3" fill="#0F172A"/>
        <rect x="8" y="9" width="13" height="9" rx="1.5" fill="#38BDF8" opacity="0.8"/>
        <rect x="23" y="9" width="13" height="9" rx="1.5" fill="#38BDF8" opacity="0.8"/>
        <!-- Headlights -->
        <rect x="4" y="24" width="6" height="5" rx="1.5" fill="#FEF08A"/>
        <rect x="34" y="24" width="6" height="5" rx="1.5" fill="#FEF08A"/>
        <!-- Grill & Bumper -->
        <rect x="14" y="24" width="16" height="5" rx="1" fill="#334155"/>
        <rect x="2" y="32" width="40" height="4" rx="1" fill="#1E293B"/>
        <!-- Wheels -->
        <rect x="0" y="10" width="3" height="8" rx="1" fill="#0F172A"/>
        <rect x="41" y="10" width="3" height="8" rx="1" fill="#0F172A"/>
        <rect x="0" y="24" width="3" height="8" rx="1" fill="#0F172A"/>
        <rect x="41" y="24" width="3" height="8" rx="1" fill="#0F172A"/>
      </g>
    </svg>
  `;
  const hasMaps = typeof window !== 'undefined' && window.google && window.google.maps;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: hasMaps ? new window.google.maps.Size(90, 90) : undefined,
    anchor: hasMaps ? new window.google.maps.Point(45, 45) : undefined
  };
};

export default function BusMap({
  busData,
  busLocation,
  focusTrigger = 0,
  isLive,
  busNumber,
  stops = [],
  nextStopName,
  nextStopMinutes = 8,
  onBack,
  onRecenter
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const hasFittedBounds = useRef(false);

  const effectiveData = busData || busLocation || {};
  const effectiveStatus = effectiveData.status || (isLive ? 'LIVE' : 'NOT_STARTED');

  // Continuous freshness ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const rawLat = Number(effectiveData.latitude ?? effectiveData.lat);
  const rawLng = Number(effectiveData.longitude ?? effectiveData.lng);
  const hasValidBusCoords = isValidCoordinate(rawLat, rawLng);

  const freshness = calculateLocationFreshness({ ...effectiveData, status: effectiveStatus }, now);
  const isFreshLive = isLive || effectiveStatus === 'LIVE' || freshness === 'LIVE';

  // Fallback initial center to first stop or Vizag corridor
  const defaultCenter = stops.length > 0 && isValidCoordinate(stops[0].lat, stops[0].lng)
    ? { lat: Number(stops[0].lat), lng: Number(stops[0].lng) }
    : { lat: 17.7816, lng: 83.3776 };

  const center = hasValidBusCoords ? { lat: rawLat, lng: rawLng } : defaultCenter;

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Compute polyline coordinates from stops
  const polylineCoords = stops
    .filter(s => isValidCoordinate(s.lat, s.lng))
    .map(s => ({ lat: Number(s.lat), lng: Number(s.lng) }));

  // Fit bounds to all stops + current bus position
  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google || !window.google.maps) return;

    if (!hasFittedBounds.current && polylineCoords.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      polylineCoords.forEach(coord => bounds.extend(coord));
      if (hasValidBusCoords) {
        bounds.extend({ lat: rawLat, lng: rawLng });
      }
      map.fitBounds(bounds, { top: 70, right: 30, bottom: 200, left: 30 });
      hasFittedBounds.current = true;
    }
  }, [map, polylineCoords, hasValidBusCoords, rawLat, rawLng]);

  // Handle focus trigger or recenter
  const handleRecenter = () => {
    if (map) {
      if (hasValidBusCoords) {
        map.panTo({ lat: rawLat, lng: rawLng });
        map.setZoom(15);
      } else if (polylineCoords.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        polylineCoords.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds, { top: 70, right: 30, bottom: 200, left: 30 });
      }
    }
    if (onRecenter) onRecenter();
  };

  useEffect(() => {
    if (focusTrigger > 0) {
      handleRecenter();
    }
  }, [focusTrigger]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="bus-map-wrapper map-empty-state">
        <Bus size={28} />
        <strong>Map is not configured yet</strong>
        <p>Your institution can enable tracking once its Google Maps key is configured.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bus-map-wrapper flex-center" style={{ padding: '40px', textAlign: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#dc2626', fontWeight: 600 }}>Google Maps loading error. Please check your internet connection or API credentials.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bus-map-wrapper flex-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <Bus size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
          <p>Loading Transit Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bus-map-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 1. FLOATING TOP MAP OVERLAYS */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="map-overlay-btn map-back-btn"
          aria-label="Back to Journey Search"
          title="Back to search"
        >
          <ChevronLeft size={22} color="#0F172A" />
        </button>
      )}

      <div className="map-overlay-top-right">
        {/* Live Pill Badge */}
        <div className={`map-live-badge ${isFreshLive ? 'active' : 'standby'}`}>
          <span className="live-dot" />
          <span>{isFreshLive ? 'Live' : 'Standby'}</span>
        </div>

        {/* Recenter Crosshair Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className="map-overlay-btn map-recenter-btn"
          aria-label="Recenter bus location"
          title="Recenter location"
        >
          <Crosshair size={20} color="#0F172A" />
        </button>
      </div>

      {/* 2. NEXT STOP FLOATING TOOLTIP CALLOUT */}
      {isFreshLive && nextStopName && (
        <div className="map-next-stop-callout">
          <div className="callout-icon">
            <Navigation size={13} color="#FFFFFF" fill="#FFFFFF" />
          </div>
          <div className="callout-info">
            <span className="callout-time">{nextStopMinutes || 8} min to next stop</span>
            <span className="callout-name">{nextStopName}</span>
          </div>
          <span className="callout-arrow">›</span>
        </div>
      )}

      {/* 3. GOOGLE MAP CANVAS */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={transitMapOptions}
      >
        {/* Route Polyline */}
        {polylineCoords.length > 1 && (
          <PolylineF
            path={polylineCoords}
            options={{
              strokeColor: '#2563EB',
              strokeOpacity: 0.9,
              strokeWeight: 5,
              geodesic: true
            }}
          />
        )}

        {/* Route Stops Markers with floating white time pills */}
        {stops.map((stop, idx) => {
          if (!isValidCoordinate(stop.lat, stop.lng)) return null;
          return (
            <MarkerF
              key={`stop-${idx}-${stop.name}`}
              position={{ lat: Number(stop.lat), lng: Number(stop.lng) }}
              icon={getStopMarkerIcon(stop, idx, stops.length)}
              zIndex={idx === 0 || idx === stops.length - 1 ? 5 : 2}
            />
          );
        })}

        {/* Live Yellow Bus Marker with Animated Pulsing Radar */}
        {hasValidBusCoords && (
          <MarkerF
            position={{ lat: rawLat, lng: rawLng }}
            icon={getYellowBusMarkerIcon(isFreshLive)}
            zIndex={10}
            onClick={() => setShowInfoWindow(!showInfoWindow)}
          >
            {showInfoWindow && (
              <InfoWindowF
                position={{ lat: rawLat, lng: rawLng }}
                onCloseClick={() => setShowInfoWindow(false)}
              >
                <div style={{ fontFamily: 'Inter, sans-serif', padding: '6px', minWidth: '180px' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                    {busNumber || effectiveData?.busNumber || 'Corridor Vehicle'}
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>
                    Speed: <strong>{Math.round(effectiveData.speed || 0)} km/h</strong>
                  </span>
                  <span style={{ fontSize: '0.78rem', color: isFreshLive ? '#16A34A' : '#D97706', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                    {isFreshLive ? 'Streaming Live GPS' : 'Standby / Last Position'}
                  </span>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )}
      </GoogleMap>
    </div>
  );
}
