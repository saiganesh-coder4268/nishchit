/**
 * Nishchit Core Route Service Compatibility Layer
 * Routes all subscriptions and actions to authoritative Firebase transportService.
 */

import {
  subscribeRoutes,
  subscribeSingleRoute,
  subscribeDriverApplications,
  approveDriverApplication,
  rejectDriverApplication,
  startDriverTrip,
  streamDriverGpsLocation,
  endDriverTrip,
  subscribeLiveLocation,
  subscribeSingleBus
} from '../services/transportService';

export const subscribe = (path, callback) => {
  if (path.startsWith('routes/')) {
    return subscribeSingleRoute(path.replace('routes/', ''), callback);
  }
  if (path === 'routes') {
    return subscribeRoutes(callback);
  }
  if (path === 'driverApplications') {
    return subscribeDriverApplications(callback);
  }
  if (path.startsWith('buses/')) {
    return subscribeSingleBus(path.replace('buses/', ''), callback);
  }
  return () => {};
};

export const subscribeRoute = (routeId, callback) => subscribeSingleRoute(routeId, callback);
export const subscribeTrip = (routeIdOrBusId, callback) => subscribeLiveLocation(routeIdOrBusId, callback);
export { subscribeRoutes, subscribeDriverApplications as subscribeApplications };

export async function submitApplication(uid, data) {
  const { submitDriverApplication } = await import('../services/transportService');
  return submitDriverApplication({ uid, ...data });
}

export async function reviewApplication(uid, status, reviewerUid, rejectionReason = '') {
  if (status === 'approved') {
    return approveDriverApplication(uid, uid, 'BUS-24', 'ROUTE-VZ04', reviewerUid);
  } else {
    return rejectDriverApplication(uid, uid, rejectionReason, reviewerUid);
  }
}

export async function beginTrip(routeId, coords = { latitude: 18.1145, longitude: 83.4021 }) {
  return startDriverTrip({
    busId: 'BUS-24',
    routeId,
    driverInfo: { uid: 'driver', name: 'Driver', busNumber: 'Bus 24' },
    initialCoords: coords
  });
}

export async function finishTrip(routeId, coords = null) {
  return endDriverTrip({
    tripId: `TRIP-BUS-24`,
    busId: 'BUS-24',
    driverInfo: { uid: 'driver', name: 'Driver' },
    finalCoords: coords
  });
}

export async function publishLocation(routeId, location) {
  return streamDriverGpsLocation({
    tripId: `TRIP-BUS-24`,
    busId: 'BUS-24',
    coords: {
      latitude: location.lat || location.latitude,
      longitude: location.lng || location.longitude,
      accuracy: location.accuracy || 10,
      heading: location.heading || 0,
      speed: location.speed || 0
    }
  });
}
