import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, MapPin, Play, Square } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { beginTrip, finishTrip, publishLocation, subscribeRoute, subscribeTrip } from '../core/routeService';

export default function DriverWorkspace() {
  const { currentUser } = useAuth(); const routeId = currentUser?.routeId; const [route, setRoute] = useState(null); const [trip, setTrip] = useState(null); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const watch = useRef(null); const lastWrite = useRef(0);
  useEffect(() => subscribeRoute(routeId, setRoute), [routeId]); useEffect(() => subscribeTrip(routeId, setTrip), [routeId]); useEffect(() => () => watch.current && navigator.geolocation.clearWatch(watch.current), []);
  const stopWatch = () => { if (watch.current) navigator.geolocation.clearWatch(watch.current); watch.current = null; };
  const start = async () => {
    if (!routeId || !route) return setNotice('Your route is awaiting assignment from transport management.');
    if (!navigator.geolocation) return setNotice('This device cannot share location. Please use a compatible browser.');
    setBusy(true); setNotice('Getting your device location…');
    navigator.geolocation.getCurrentPosition(async position => {
      const push = async p => { const c = p.coords; if (Date.now() - lastWrite.current < 6000) return; lastWrite.current = Date.now(); await publishLocation(routeId, { lat: c.latitude, lng: c.longitude, accuracy: c.accuracy, heading: c.heading ?? null }); };
      await beginTrip(routeId); await push(position); setNotice('Location sharing is active.');
      watch.current = navigator.geolocation.watchPosition(push, error => setNotice(error.code === 1 ? 'Location permission is needed to start this trip.' : 'Your device could not determine its location. Check location services and retry.'), { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }); setBusy(false);
    }, error => { setBusy(false); setNotice(error.code === 1 ? 'Location permission was denied. Enable it in your browser and try again.' : 'Your device could not determine its location. Check location services and retry.'); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
  };
  const end = async () => { setBusy(true); stopWatch(); await finishTrip(routeId); setNotice('Trip ended. Location sharing is off.'); setBusy(false); };
  const started = trip?.status === 'started';
  if (currentUser?.verificationStatus !== 'approved') return <main className="driver-workspace"><section className="driver-status-card"><span className="section-label">Driver account</span><h1>Verification pending</h1><p>Your application is with transport management. You’ll see your route here when it has been reviewed and assigned.</p>{currentUser?.verificationStatus === 'rejected' && <p className="error-text">Your application needs attention. Please contact your transport administrator.</p>}</section></main>;
  return <main className="driver-workspace"><header><span className="section-label">Today’s assignment</span><h1>{route?.name || 'Awaiting route assignment'}</h1><p>{route ? `${route.vehicleNumber || 'Vehicle not configured'} · report ${route.reportingTime || '—'} · departure ${route.departureTime || '—'}` : 'Transport management has not assigned a route yet.'}</p></header><section className={`driver-status-card ${started ? 'is-active' : ''}`}><div><span className="trip-state">{started ? 'Trip in progress' : 'Ready when you are'}</span><h2>{started ? 'Location sharing active' : 'Start only when departing'}</h2><p>{started ? 'Parents on this route can see your latest device location.' : 'Starting a trip turns on location sharing for your assigned route.'}</p></div>{started ? <button className="trip-control end" onClick={end} disabled={busy}><Square/> End trip</button> : <button className="trip-control" onClick={start} disabled={busy || !route}><Play/> {busy ? 'Getting location…' : 'Start trip'}</button>}</section>{notice && <p className="operational-notice"><MapPin size={17}/>{notice}</p>}{trip?.location && <section className="location-readout"><span>Latest location</span><strong>{trip.location.lat.toFixed(6)}, {trip.location.lng.toFixed(6)}</strong><small>Accuracy ±{Math.round(trip.location.accuracy || 0)} m</small></section>}</main>;
}
