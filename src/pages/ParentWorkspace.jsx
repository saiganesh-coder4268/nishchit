import React, { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RouteMap from '../components/RouteMap';
import { subscribeRoute, subscribeTrip } from '../core/routeService';

export default function ParentWorkspace() {
 const { currentUser } = useAuth(); const routeId = currentUser?.routeId; const [route,setRoute]=useState(null); const [trip,setTrip]=useState(null); const [now,setNow]=useState(Date.now()); useEffect(()=>subscribeRoute(routeId,setRoute),[routeId]); useEffect(()=>subscribeTrip(routeId,setTrip),[routeId]); useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),10000);return()=>clearInterval(id)},[]);
 const age=trip?.location?.updatedAt ? Math.floor((now-trip.location.updatedAt)/1000):null; const stale=trip?.status==='started' && age>90; const copy=!routeId?'Your child has not been assigned to a route yet.':trip?.status==='started'?(stale?`Location last updated ${Math.ceil(age/60)} minutes ago.`:'On the way'):trip?.status==='ended'?'Today’s trip has ended.':'Waiting for the bus to start.';
 return <main className="parent-workspace"><header><span className="section-label">Transport for {currentUser?.childName || 'your child'}</span><h1>{route?.name || 'Route assignment pending'}</h1><p>{copy}</p></header><section className={`parent-trip-banner ${trip?.status || 'not-started'} `}><span className="status-dot"/><strong>{trip?.status==='started' ? (stale?'Location needs attention':'On the way') : trip?.status==='ended'?'Trip ended':'Bus hasn’t started yet'}</strong>{age !== null && <span><Clock size={15}/> Last updated {age < 60 ? `${age} sec ago` : `${Math.ceil(age/60)} min ago`}</span>}</section><section className="parent-map-shell"><RouteMap location={trip?.location} route={route}/></section><section className="route-facts"><div><span>Vehicle</span><strong>{route?.vehicleNumber || 'Not configured yet'}</strong></div><div><span>Departure</span><strong>{route?.departureTime || 'Not configured yet'}</strong></div><div><span>Driver</span><strong>{route?.driverName || 'Not configured yet'}</strong></div></section></main>;
}
