import { onValue, ref, set, update } from 'firebase/database';
import { database } from '../firebase';

export const subscribe = (path, callback) => onValue(ref(database, path), snap => callback(snap.exists() ? snap.val() : null), () => callback(null));
export const subscribeRoute = (routeId, callback) => routeId ? subscribe(`routes/${routeId}`, callback) : () => callback(null);
export const subscribeTrip = (routeId, callback) => routeId ? subscribe(`trips/${routeId}`, callback) : () => callback(null);
export const subscribeRoutes = callback => subscribe('routes', value => callback(value ? Object.entries(value).map(([id, route]) => ({ id, ...route })) : []));
export const subscribeApplications = callback => subscribe('driverApplications', value => callback(value ? Object.entries(value).map(([id, application]) => ({ id, ...application })) : []));

export async function submitApplication(uid, data) {
  await set(ref(database, `driverApplications/${uid}`), { ...data, status: 'pending', submittedAt: Date.now() });
  await update(ref(database, `users/${uid}`), { verificationStatus: 'pending' });
}

export async function reviewApplication(uid, status, reviewerUid, rejectionReason = '') {
  await update(ref(database, `driverApplications/${uid}`), { status, reviewedBy: reviewerUid, reviewedAt: Date.now(), rejectionReason });
  await update(ref(database, `users/${uid}`), { verificationStatus: status });
}

export async function saveRoute(routeId, route) {
  await set(ref(database, `routes/${routeId}`), route);
  if (route.driverUid) await update(ref(database, `users/${route.driverUid}`), { routeId });
}

export async function beginTrip(routeId) {
  await update(ref(database, `trips/${routeId}`), { status: 'started', startedAt: Date.now(), endedAt: null });
}
export async function finishTrip(routeId) { await update(ref(database, `trips/${routeId}`), { status: 'ended', endedAt: Date.now() }); }
export async function publishLocation(routeId, location) { await update(ref(database, `trips/${routeId}`), { location: { ...location, updatedAt: Date.now() } }); }
