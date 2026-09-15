/**
 * Nishchit Centralized Firebase Transport Service
 * Authoritative Firestore data layer + High-frequency Realtime Database GPS stream.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import {
  ref as rtdbRef,
  set as rtdbSet,
  update as rtdbUpdate,
  push as rtdbPush,
  onValue as rtdbOnValue,
  get as rtdbGet
} from 'firebase/database';
import { db, rtdb } from '../firebase';
import { INITIAL_VEHICLES, INITIAL_ROUTES, REGISTERED_INSTITUTIONS, INITIAL_JOBS, INITIAL_VERIFIED_DRIVERS, INITIAL_STUDENTS } from '../data/regionData';
import { isValidCoordinate } from '../utils/busStatus';

// ---------------------------------------------------------------------------
// 1. DATABASE BOOTSTRAP / SEED
// ---------------------------------------------------------------------------

/**
 * Production environment guarantee:
 * Never auto-seed fake or fallback data on application startup.
 */
export async function ensureInitialCorridorData() {
  // Production safe: No automatic seeding of fake records.
  return Promise.resolve();
}

/**
 * Explicit Developer / Administrative Seed Function
 * Only executed when explicitly invoked from admin dev tools, never during normal app boots.
 */
export async function seedDemoCorridorData() {
  try {
    const busesSnap = await getDocs(collection(db, 'buses'));
    if (busesSnap.empty) {
      for (const bus of INITIAL_VEHICLES) {
        await setDoc(doc(db, 'buses', bus.id), {
          ...bus,
          busId: bus.id,
          status: bus.status || 'AVAILABLE',
          capacity: bus.capacity || 52,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    }

    const routesSnap = await getDocs(collection(db, 'routes'));
    if (routesSnap.empty) {
      for (const route of INITIAL_ROUTES) {
        await setDoc(doc(db, 'routes', route.id), {
          ...route,
          routeId: route.id,
          routeName: route.name,
          from: route.from || (route.stops?.[0]?.name || 'Vizianagaram'),
          to: route.to || (route.stops?.[route.stops.length - 1]?.name || 'Visakhapatnam'),
          status: 'ACTIVE',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    }
  } catch (err) {
    console.error('Explicit corridor data seed error:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 2. USER PROFILE
// ---------------------------------------------------------------------------

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function saveUserProfile(uid, data) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const now = Date.now();
  const payload = {
    ...data,
    updatedAt: now
  };
  if (!snap.exists()) {
    payload.createdAt = now;
  }
  await setDoc(userRef, payload, { merge: true });
}

export function subscribeUserProfile(uid, callback) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      callback(snap.exists() ? { uid: snap.id, ...snap.data() } : null);
    },
    (err) => {
      console.warn('subscribeUserProfile error:', err);
      callback(null);
    }
  );
}

// ---------------------------------------------------------------------------
// 3. DRIVER VERIFICATION APPLICATIONS
// ---------------------------------------------------------------------------

export async function submitDriverApplication(driverData) {
  const appId = driverData.uid || 'DRV-' + Date.now();
  const now = Date.now();
  const applicationPayload = {
    driverId: driverData.uid || appId,
    applicationId: appId,
    name: driverData.name || driverData.fullName || '',
    fullName: driverData.fullName || driverData.name || '',
    email: driverData.email || '',
    phone: driverData.phone || '',
    busNumber: driverData.busNumber || '',
    from: driverData.from || '',
    to: driverData.to || '',
    pincode: driverData.pincode || '',
    locality: driverData.locality || '',
    district: driverData.district || '',
    institutionId: driverData.institutionId || '',
    institutionName: driverData.institutionName || '',
    licenceNumber: driverData.licenceNumber || '',
    licenceValidity: driverData.licenceValidity || '',
    idDocumentType: driverData.idDocumentType || '',
    idDocumentNumber: driverData.idDocumentNumber || '',
    idDocValidity: driverData.idDocValidity || '',
    experienceYears: driverData.experienceYears || '',
    photoUrl: driverData.photoUrl || '',
    status: 'pending',
    verificationStatus: 'pending',
    submittedAt: now,
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null
  };

  // 1. Save application document in Firestore
  await setDoc(doc(db, 'driverApplications', appId), applicationPayload);

  // 2. Update user profile
  await saveUserProfile(driverData.uid || appId, {
    role: 'driver',
    status: 'pending',
    verificationStatus: 'pending',
    ...applicationPayload
  });

  return applicationPayload;
}

export function subscribeDriverApplications(callback) {
  const q = collection(db, 'driverApplications');
  return onSnapshot(
    q,
    (snap) => {
      const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      apps.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
      callback(apps);
    },
    (err) => {
      console.warn('subscribeDriverApplications error:', err);
      callback([]);
    }
  );
}

export async function approveDriverApplication(appId, driverId, busId, routeId, adminUid = 'admin') {
  if (!busId || !routeId) {
    throw new Error('Both a valid Bus and Route must be explicitly assigned to approve driver.');
  }

  const now = Date.now();
  const targetUid = driverId || appId;

  // Verify bus exists
  const busSnap = await getDoc(doc(db, 'buses', busId));
  if (!busSnap.exists()) {
    throw new Error(`Assigned bus "${busId}" does not exist in the fleet database.`);
  }
  const busData = busSnap.data() || {};
  const busNumber = busData.busNumber || busId;
  const registrationNumber = busData.registrationNumber || '';

  // Verify route exists
  const routeSnap = await getDoc(doc(db, 'routes', routeId));
  if (!routeSnap.exists()) {
    throw new Error(`Assigned route "${routeId}" does not exist in the route database.`);
  }
  const routeData = routeSnap.data() || {};
  const routeName = routeData.routeName || routeData.name || routeId;
  const routeCode = routeData.code || routeData.routeNumber || '';

  // Fetch application details to get genuine name and phone
  let driverName = 'Driver';
  let driverPhone = '';
  try {
    const appSnap = await getDoc(doc(db, 'driverApplications', appId));
    if (appSnap.exists()) {
      const appData = appSnap.data();
      driverName = appData.fullName || appData.name || driverName;
      driverPhone = appData.phone || '';
    }
  } catch (e) {
    console.warn('App details fetch note:', e);
  }

  // Atomic batch write across driverApplications, users, buses, routes
  const batch = writeBatch(db);

  // 1. Update application
  batch.update(doc(db, 'driverApplications', appId), {
    status: 'approved',
    verificationStatus: 'approved',
    reviewedAt: now,
    reviewedBy: adminUid,
    assignedBusId: busId,
    assignedRouteId: routeId,
    busId: busId,
    routeId: routeId,
    busNumber,
    registrationNumber,
    routeName,
    rejectionReason: null
  });

  // 2. Update user profile
  batch.set(
    doc(db, 'users', targetUid),
    {
      role: 'driver',
      status: 'approved',
      verificationStatus: 'approved',
      reviewedAt: now,
      reviewedBy: adminUid,
      busId: busId,
      assignedBusId: busId,
      busNumber,
      busRegistrationNumber: registrationNumber,
      routeId: routeId,
      assignedRouteId: routeId,
      routeName,
      routeCode,
      rejectionReason: null,
      updatedAt: now
    },
    { merge: true }
  );

  // 3. Update bus
  batch.update(doc(db, 'buses', busId), {
    driverId: targetUid,
    driverName,
    driverPhone,
    routeId,
    routeName,
    status: 'ASSIGNED',
    updatedAt: now
  });

  // 4. Update route
  batch.update(doc(db, 'routes', routeId), {
    driverId: targetUid,
    driverName,
    busId,
    busNumber,
    updatedAt: now
  });

  await batch.commit();
}

export async function rejectDriverApplication(appId, driverId, rejectionReason, adminUid = 'admin') {
  const reasonText = (rejectionReason || '').trim();
  if (!reasonText) {
    throw new Error('A rejection reason must be provided to reject an application.');
  }

  const now = Date.now();
  const targetUid = driverId || appId;

  const batch = writeBatch(db);

  batch.update(doc(db, 'driverApplications', appId), {
    status: 'rejected',
    verificationStatus: 'rejected',
    reviewedAt: now,
    reviewedBy: adminUid,
    rejectionReason: reasonText
  });

  batch.set(
    doc(db, 'users', targetUid),
    {
      status: 'rejected',
      verificationStatus: 'rejected',
      rejectionReason: reasonText,
      reviewedAt: now,
      reviewedBy: adminUid,
      busId: null,
      assignedBusId: null,
      routeId: null,
      assignedRouteId: null,
      updatedAt: now
    },
    { merge: true }
  );

  await batch.commit();
}

// ---------------------------------------------------------------------------
// 4. FLEET / BUS MANAGEMENT
// ---------------------------------------------------------------------------

export function subscribeBuses(callback) {
  const colRef = collection(db, 'buses');
  return onSnapshot(
    colRef,
    (snap) => {
      const buses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(buses);
    },
    (err) => {
      console.warn('subscribeBuses error:', err);
      callback([]);
    }
  );
}

export function subscribeSingleBus(busId, callback) {
  if (!busId) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'buses', busId),
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    (err) => {
      console.warn('subscribeSingleBus error:', err);
      callback(null);
    }
  );
}

export async function createBus(busData) {
  const busId = busData.busId || busData.id || `BUS-${Date.now().toString().slice(-4)}`;
  const now = Date.now();
  const payload = {
    id: busId,
    busId,
    busNumber: busData.busNumber || 'Bus New',
    registrationNumber: busData.registrationNumber || 'AP 35 XX 0000',
    capacity: Number(busData.capacity) || 52,
    status: busData.status || 'AVAILABLE',
    driverId: busData.driverId || null,
    driverName: busData.driverName || null,
    driverPhone: busData.driverPhone || null,
    routeId: busData.routeId || null,
    routeName: busData.routeName || null,
    createdAt: now,
    updatedAt: now
  };
  await setDoc(doc(db, 'buses', busId), payload);
  return payload;
}

export async function updateBus(busId, updates) {
  if (!busId) return;
  await updateDoc(doc(db, 'buses', busId), {
    ...updates,
    updatedAt: Date.now()
  });
}

export async function deleteBus(busId) {
  if (!busId) return;
  await deleteDoc(doc(db, 'buses', busId));
}

// ---------------------------------------------------------------------------
// 5. ROUTE MANAGEMENT
// ---------------------------------------------------------------------------

export function subscribeRoutes(callback) {
  const colRef = collection(db, 'routes');
  return onSnapshot(
    colRef,
    (snap) => {
      const routes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(routes);
    },
    (err) => {
      console.warn('subscribeRoutes error:', err);
      callback([]);
    }
  );
}

export function subscribeSingleRoute(routeId, callback) {
  if (!routeId) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'routes', routeId),
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    (err) => {
      console.warn('subscribeSingleRoute error:', err);
      callback(null);
    }
  );
}

export async function createRoute(routeData) {
  const routeId = routeData.routeId || routeData.id || `ROUTE-${Date.now().toString().slice(-4)}`;
  const now = Date.now();
  const payload = {
    id: routeId,
    routeId,
    routeName: routeData.routeName || routeData.name || 'New Route',
    name: routeData.routeName || routeData.name || 'New Route',
    code: routeData.code || 'RT',
    from: routeData.from || '',
    to: routeData.to || '',
    stops: routeData.stops || [],
    reportingTime: routeData.reportingTime || '07:00 AM',
    departureTime: routeData.departureTime || '07:15 AM',
    expectedArrival: routeData.expectedArrival || '08:15 AM',
    busId: routeData.busId || null,
    driverId: routeData.driverId || null,
    driverName: routeData.driverName || null,
    status: routeData.status || 'ACTIVE',
    createdAt: now,
    updatedAt: now
  };
  await setDoc(doc(db, 'routes', routeId), payload);
  return payload;
}

export async function updateRoute(routeId, updates) {
  if (!routeId) return;
  await updateDoc(doc(db, 'routes', routeId), {
    ...updates,
    updatedAt: Date.now()
  });
}

export async function deleteRoute(routeId) {
  if (!routeId) return;
  await deleteDoc(doc(db, 'routes', routeId));
}

// ---------------------------------------------------------------------------
// 6. TRIPS & LIVE GPS TELEMETRY
// ---------------------------------------------------------------------------

export async function startDriverTrip(arg1, arg2, arg3) {
  let busId;
  let routeId;
  let driverInfo = {};
  let initialCoords = null;

  if (typeof arg1 === 'string') {
    busId = arg1;
    driverInfo = typeof arg2 === 'object' ? arg2 : { uid: arg2 };
    const extra = arg3 || {};
    routeId = extra.routeId || driverInfo.routeId || '';
    if (isValidCoordinate(extra.latitude, extra.longitude)) {
      initialCoords = {
        latitude: Number(extra.latitude),
        longitude: Number(extra.longitude),
        accuracy: extra.accuracy ?? 10
      };
    }
    if (extra.driverName) driverInfo.name = extra.driverName;
  } else if (arg1 && typeof arg1 === 'object') {
    busId = arg1.busId;
    routeId = arg1.routeId || '';
    driverInfo = arg1.driverInfo || {};
    if (arg1.initialCoords && isValidCoordinate(arg1.initialCoords.latitude, arg1.initialCoords.longitude)) {
      initialCoords = {
        latitude: Number(arg1.initialCoords.latitude),
        longitude: Number(arg1.initialCoords.longitude),
        accuracy: arg1.initialCoords.accuracy ?? 10
      };
    }
  }

  if (!busId) throw new Error('Cannot start trip: No bus assigned.');
  if (!driverInfo?.uid && !driverInfo?.driverId) {
    throw new Error('Cannot start trip: Driver identity missing.');
  }

  const tripId = `TRIP-${busId}-${Date.now()}`;
  const now = Date.now();

  const hasGpsFix = initialCoords !== null;
  const lat = hasGpsFix ? initialCoords.latitude : null;
  const lng = hasGpsFix ? initialCoords.longitude : null;

  const tripPayload = {
    tripId,
    id: tripId,
    driverId: driverInfo.uid || driverInfo.driverId || '',
    driverName: driverInfo.name || driverInfo.fullName || 'Assigned Driver',
    driverPhone: driverInfo.phone || '',
    busId,
    busNumber: driverInfo.busNumber || busId,
    registrationNumber: driverInfo.busRegistrationNumber || driverInfo.registrationNumber || '',
    routeId: routeId || driverInfo.routeId || '',
    routeName: driverInfo.routeName || '',
    status: 'ACTIVE',
    startedAt: now,
    endedAt: null,
    startedLocation: hasGpsFix ? { latitude: lat, longitude: lng } : null,
    currentLocation: hasGpsFix ? { latitude: lat, longitude: lng, accuracy: initialCoords.accuracy || 10 } : null,
    lastLocationUpdate: hasGpsFix ? now : null
  };

  // 1. Create Firestore trip
  await setDoc(doc(db, 'trips', tripId), tripPayload);

  // 2. Update Firestore bus
  const busUpdates = {
    status: 'ON_TRIP',
    activeTripId: tripId,
    lastUpdated: now,
    updatedAt: now
  };
  if (hasGpsFix) {
    busUpdates.latitude = lat;
    busUpdates.longitude = lng;
    busUpdates.accuracy = initialCoords.accuracy || 10;
    busUpdates.speed = initialCoords.speed || 0;
    busUpdates.heading = initialCoords.heading || 0;
  }
  await updateDoc(doc(db, 'buses', busId), busUpdates);

  // 3. Publish to Realtime Database
  const rtdbPayload = {
    tripId,
    busId,
    busNumber: tripPayload.busNumber,
    registrationNumber: tripPayload.registrationNumber,
    routeId: tripPayload.routeId,
    routeName: tripPayload.routeName,
    driverId: tripPayload.driverId,
    driverName: tripPayload.driverName,
    driverPhone: tripPayload.driverPhone,
    latitude: lat,
    longitude: lng,
    accuracy: hasGpsFix ? (initialCoords.accuracy || 10) : null,
    speed: 0,
    heading: 0,
    timestamp: now,
    active: true
  };

  try {
    await rtdbSet(rtdbRef(rtdb, `liveLocations/${tripId}`), rtdbPayload);
    await rtdbSet(rtdbRef(rtdb, `liveLocations/${busId}`), rtdbPayload);
    await rtdbSet(rtdbRef(rtdb, `busLocations/${busId}`), rtdbPayload);

    // 4. Send start message to bus channel
    await rtdbPush(rtdbRef(rtdb, `messages/${busId}`), {
      senderId: driverInfo.uid || 'driver-sys',
      senderName: tripPayload.driverName,
      senderRole: 'driver',
      message: 'Trip Started: Live GPS tracking is now streaming from the bus.',
      timestamp: now,
      isSystemMessage: true
    });
  } catch (e) {
    console.warn('RTDB publish note:', e);
  }

  return tripId;
}

let lastFirestoreSync = 0;
export async function streamDriverGpsLocation(arg1, arg2) {
  let busId;
  let tripId;
  let coords = {};

  if (typeof arg1 === 'string') {
    busId = arg1;
    coords = arg2 || {};
    tripId = coords.activeTripId || coords.tripId || busId;
  } else if (arg1 && typeof arg1 === 'object') {
    busId = arg1.busId;
    tripId = arg1.tripId || arg1.activeTripId || busId;
    coords = arg1.coords || arg1;
  }

  if (!busId) return;
  const lat = Number(coords.latitude ?? coords.lat);
  const lng = Number(coords.longitude ?? coords.lng);
  if (!isValidCoordinate(lat, lng)) {
    return;
  }

  const now = Date.now();
  const updatePayload = {
    latitude: lat,
    longitude: lng,
    accuracy: Math.round(coords.accuracy || 5),
    speed: coords.speed || 0,
    heading: coords.heading || 0,
    timestamp: now,
    active: true,
    busId,
    tripId: tripId || busId
  };

  try {
    // 1. High-frequency update to RTDB paths
    await rtdbSet(rtdbRef(rtdb, `liveLocations/${busId}`), updatePayload);
    if (tripId && tripId !== busId) {
      await rtdbSet(rtdbRef(rtdb, `liveLocations/${tripId}`), updatePayload);
    }
    await rtdbSet(rtdbRef(rtdb, `busLocations/${busId}`), updatePayload);

    // 2. Low-frequency throttle to Firestore
    if (now - lastFirestoreSync > 15000) {
      lastFirestoreSync = now;
      await updateDoc(doc(db, 'buses', busId), {
        latitude: lat,
        longitude: lng,
        accuracy: Math.round(coords.accuracy || 5),
        speed: coords.speed || 0,
        heading: coords.heading || 0,
        lastUpdated: now,
        status: 'ON_TRIP'
      });
      if (tripId && tripId !== busId) {
        try {
          await updateDoc(doc(db, 'trips', tripId), {
            currentLocation: { latitude: lat, longitude: lng, accuracy: coords.accuracy || 5 },
            lastLocationUpdate: now
          });
        } catch {}
      }
    }
  } catch (err) {
    console.warn('streamDriverGpsLocation error:', err?.message || err);
  }
}

export async function endDriverTrip(arg1, arg2, arg3) {
  let busId;
  let tripId;
  let driverInfo = {};

  if (typeof arg1 === 'string') {
    busId = arg1;
    tripId = arg2;
    driverInfo = arg3 || {};
  } else if (arg1 && typeof arg1 === 'object') {
    busId = arg1.busId;
    tripId = arg1.tripId;
    driverInfo = arg1.driverInfo || {};
  }

  const now = Date.now();
  let durationMinutes = 0;
  let tripData = null;

  if (tripId) {
    try {
      const tripSnap = await getDoc(doc(db, 'trips', tripId));
      if (tripSnap.exists()) {
        tripData = tripSnap.data();
        if (tripData.startedAt) {
          durationMinutes = Math.max(1, Math.round((now - tripData.startedAt) / 60000));
        }
      }

      await updateDoc(doc(db, 'trips', tripId), {
        status: 'COMPLETED',
        endedAt: now,
        durationMinutes
      });

      // Archive to tripHistory collection so Admin history displays completed runs
      await setDoc(doc(db, 'tripHistory', tripId), {
        ...(tripData || {}),
        tripId,
        busId: busId || tripData?.busId || '',
        status: 'COMPLETED',
        endedAt: now,
        durationMinutes,
        createdAt: now
      });
    } catch (e) {
      console.warn('Trip complete note:', e);
    }
  }

  if (busId) {
    try {
      await updateDoc(doc(db, 'buses', busId), {
        status: 'COMPLETED',
        activeTripId: null,
        updatedAt: now
      });
    } catch (e) {
      console.warn('Bus status note:', e);
    }

    try {
      await rtdbUpdate(rtdbRef(rtdb, `liveLocations/${busId}`), { active: false, endedAt: now });
      await rtdbUpdate(rtdbRef(rtdb, `busLocations/${busId}`), { active: false, endedAt: now });
      if (tripId && tripId !== busId) {
        await rtdbUpdate(rtdbRef(rtdb, `liveLocations/${tripId}`), { active: false, endedAt: now });
      }

      await rtdbPush(rtdbRef(rtdb, `messages/${busId}`), {
        senderId: driverInfo?.uid || 'driver-sys',
        senderName: driverInfo?.name || driverInfo?.fullName || 'Driver',
        senderRole: 'driver',
        message: "Trip Completed: Today's bus run has concluded safely.",
        timestamp: now,
        isSystemMessage: true
      });
    } catch (e) {
      console.warn('RTDB end trip note:', e);
    }
  }
}

// ---------------------------------------------------------------------------
// 7. REALTIME GPS LISTENERS
// ---------------------------------------------------------------------------

export function subscribeLiveLocation(tripIdOrBusId, callback) {
  if (!tripIdOrBusId) {
    callback(null);
    return () => {};
  }

  const tripRef = rtdbRef(rtdb, `liveLocations/${tripIdOrBusId}`);
  const unsubTrip = rtdbOnValue(
    tripRef,
    (snap) => {
      if (snap.exists() && snap.val()?.active) {
        callback(snap.val());
      } else {
        const busRef = rtdbRef(rtdb, `busLocations/${tripIdOrBusId}`);
        rtdbGet(busRef).then((bSnap) => {
          callback(bSnap.exists() ? bSnap.val() : null);
        }).catch(() => callback(null));
      }
    },
    (err) => {
      console.warn('subscribeLiveLocation error:', err);
      callback(null);
    }
  );

  return () => unsubTrip();
}

export function subscribeActiveTrips(callback) {
  const q = query(collection(db, 'trips'), where('status', '==', 'ACTIVE'));
  return onSnapshot(
    q,
    (snap) => {
      const trips = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(trips);
    },
    (err) => {
      console.warn('subscribeActiveTrips error:', err);
      callback([]);
    }
  );
}

export function subscribeTripHistory(callback) {
  const q = query(collection(db, 'tripHistory'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(list);
    },
    (err) => {
      console.warn('subscribeTripHistory error:', err);
      callback([]);
    }
  );
}

// ---------------------------------------------------------------------------
// 8. INCIDENTS & PARENT FEEDBACK
// ---------------------------------------------------------------------------

export function subscribeIncidentReports(callback) {
  const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(list);
    },
    (err) => {
      console.warn('subscribeIncidentReports error:', err);
      callback([]);
    }
  );
}

export async function submitIncidentReport(report) {
  const reportId = `REP-${Date.now()}`;
  const payload = {
    id: reportId,
    reportId,
    ...report,
    timestamp: Date.now(),
    status: 'OPEN'
  };
  await setDoc(doc(db, 'reports', reportId), payload);
  return payload;
}

export const createIncidentReport = submitIncidentReport;

// ---------------------------------------------------------------------------
// 9. SCHEDULE MANAGEMENT & DRIVER ASSIGNMENT
// ---------------------------------------------------------------------------

export async function assignDriverToBusAndRoute({ driverId, busId, routeId, schedule = {} }) {
  if (!driverId) return;
  const now = Date.now();

  // Get driver info
  const driverProfile = await getUserProfile(driverId);
  const driverName = driverProfile?.fullName || driverProfile?.name || 'Driver';
  const driverPhone = driverProfile?.phone || '';

  // Get bus info
  let busNumber = '';
  let busRegistration = '';
  if (busId) {
    const busSnap = await getDoc(doc(db, 'buses', busId));
    if (busSnap.exists()) {
      busNumber = busSnap.data().busNumber || '';
      busRegistration = busSnap.data().registrationNumber || '';
    }
  }

  // Get route info
  let routeName = '';
  let routeCode = '';
  if (routeId) {
    const routeSnap = await getDoc(doc(db, 'routes', routeId));
    if (routeSnap.exists()) {
      routeName = routeSnap.data().routeName || routeSnap.data().name || '';
      routeCode = routeSnap.data().code || '';
    }
  }

  // 1. Update user profile
  await saveUserProfile(driverId, {
    busId: busId || null,
    busNumber: busNumber || null,
    busRegistrationNumber: busRegistration || null,
    routeId: routeId || null,
    routeName: routeName || null,
    routeCode: routeCode || null,
    departureTime: schedule.departureTime || '07:15 AM',
    expectedArrival: schedule.expectedArrival || '08:20 AM',
    reportingTime: schedule.reportingTime || '06:50 AM',
    updatedAt: now
  });

  // 2. Update bus
  if (busId) {
    await updateDoc(doc(db, 'buses', busId), {
      driverId,
      driverName,
      driverPhone,
      routeId: routeId || null,
      routeName: routeName || null,
      routeNumber: routeCode || null,
      status: 'ASSIGNED',
      updatedAt: now
    });
  }

  // 3. Update route
  if (routeId) {
    await updateDoc(doc(db, 'routes', routeId), {
      driverId,
      driverName,
      busId: busId || null,
      departureTime: schedule.departureTime || '07:15 AM',
      expectedArrival: schedule.expectedArrival || '08:20 AM',
      reportingTime: schedule.reportingTime || '06:50 AM',
      updatedAt: now
    });
  }
}

export function subscribeSchedules(callback) {
  const colRef = collection(db, 'schedules');
  return onSnapshot(
    colRef,
    (snap) => {
      const schedules = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      schedules.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      callback(schedules);
    },
    (err) => {
      console.warn('subscribeSchedules error:', err);
      callback([]);
    }
  );
}

export async function createSchedule(scheduleData) {
  const scheduleId = scheduleData.scheduleId || scheduleData.id || `SCHED-${Date.now().toString().slice(-6)}`;
  const now = Date.now();
  const payload = {
    id: scheduleId,
    scheduleId,
    busId: scheduleData.busId || '',
    busNumber: scheduleData.busNumber || '',
    driverId: scheduleData.driverId || '',
    driverName: scheduleData.driverName || '',
    routeId: scheduleData.routeId || '',
    routeName: scheduleData.routeName || '',
    routeCode: scheduleData.routeCode || '',
    operatingDay: scheduleData.operatingDay || 'Daily (Monday - Saturday)',
    departureTime: scheduleData.departureTime || '07:15 AM',
    reportingTime: scheduleData.reportingTime || '06:50 AM',
    expectedArrival: scheduleData.expectedArrival || '08:20 AM',
    stops: scheduleData.stops || [],
    createdAt: now,
    updatedAt: now
  };

  await setDoc(doc(db, 'schedules', scheduleId), payload);

  // Synchronously update driver, bus, and route assignments
  if (payload.driverId) {
    await assignDriverToBusAndRoute({
      driverId: payload.driverId,
      busId: payload.busId,
      routeId: payload.routeId,
      schedule: {
        departureTime: payload.departureTime,
        reportingTime: payload.reportingTime,
        expectedArrival: payload.expectedArrival
      }
    });
  }

  return payload;
}

export async function updateSchedule(scheduleId, updates) {
  if (!scheduleId) return;
  const now = Date.now();
  const payload = {
    ...updates,
    updatedAt: now
  };
  await updateDoc(doc(db, 'schedules', scheduleId), payload);

  if (updates.driverId) {
    await assignDriverToBusAndRoute({
      driverId: updates.driverId,
      busId: updates.busId,
      routeId: updates.routeId,
      schedule: {
        departureTime: updates.departureTime,
        reportingTime: updates.reportingTime,
        expectedArrival: updates.expectedArrival
      }
    });
  }
}

export async function deleteSchedule(scheduleId) {
  if (!scheduleId) return;
  await deleteDoc(doc(db, 'schedules', scheduleId));
}

// ---------------------------------------------------------------------------
// 10. PARENT JOURNEY DISCOVERY & RESOLUTION
// ---------------------------------------------------------------------------

function normalizeLoc(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[(),.\-\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function locationMatches(candidate, query) {
  const c = normalizeLoc(candidate);
  const q = normalizeLoc(query);
  if (!c || !q) return false;
  if (c === q || c.includes(q) || q.includes(c)) return true;

  // Token-level matching: check if strong identifying tokens match
  const stopWords = new Set(['and', 'the', 'for', 'all', 'college', 'university', 'campus', 'deemed', 'autonomous', 'engineering', 'institute', 'technology', 'sciences', 'gate', 'road', 'junction', 'area']);
  const cTokens = c.split(' ').filter(t => t.length >= 3 && !stopWords.has(t));
  const qTokens = q.split(' ').filter(t => t.length >= 3 && !stopWords.has(t));

  for (const token of cTokens) {
    if (qTokens.includes(token)) {
      return true;
    }
  }

  return false;
}

/**
 * Finds all real routes matching the requested journey (FROM -> TO).
 * Considers route origin, destination endpoint, institution, and ordered stops.
 */
export function findMatchingRoutes({ routes = [], from, to, institutionId = null }) {
  if (!routes || routes.length === 0) return [];
  if (!from && !to) return [];

  const matched = [];

  for (const route of routes) {
    // If an institutionId is specified, check if route belongs to this institution
    if (institutionId) {
      const matchesInst = route.institutionId === institutionId ||
        locationMatches(route.institutionName, institutionId) ||
        locationMatches(route.institutionId, institutionId);
      if (!matchesInst) continue;
    }

    const routeFrom = route.from || route.stops?.[0]?.name || '';
    const routeTo = route.to || route.stops?.[route.stops.length - 1]?.name || '';
    const stops = route.stops || [];

    // Find stop indices
    let fromIdx = -1;
    let toIdx = -1;

    // Check if FROM matches route origin, institution ID, or institution Name
    const matchesFromOrigin = !from || locationMatches(routeFrom, from) ||
      (route.institutionId && locationMatches(route.institutionId, from)) ||
      (route.institutionName && locationMatches(route.institutionName, from)) ||
      (route.name && locationMatches(route.name, from));

    if (matchesFromOrigin) {
      fromIdx = 0;
    } else {
      fromIdx = stops.findIndex(s => locationMatches(s.name, from));
    }

    // Check if TO matches route destination or intermediate stops
    const matchesToDestination = locationMatches(routeTo, to) ||
      (route.name && locationMatches(route.name, to));

    if (matchesToDestination) {
      toIdx = stops.length > 0 ? stops.length : 1;
    } else {
      toIdx = stops.findIndex(s => locationMatches(s.name, to));
    }

    // A route matches if both from and to are served AND from appears before or at to
    // If only 'to' is provided, we match if the route contains 'to'
    if (to && from) {
      if (fromIdx !== -1 && toIdx !== -1 && (fromIdx <= toIdx || matchesToDestination)) {
        matched.push({
          ...route,
          matchedFromIndex: fromIdx,
          matchedToIndex: toIdx
        });
      }
    } else if (to && !from) {
      if (toIdx !== -1) {
        matched.push({
          ...route,
          matchedFromIndex: 0,
          matchedToIndex: toIdx
        });
      }
    } else if (from && !to) {
      if (fromIdx !== -1) {
        matched.push({
          ...route,
          matchedFromIndex: fromIdx,
          matchedToIndex: stops.length > 0 ? stops.length - 1 : 1
        });
      }
    }
  }

  return matched;
}

/**
 * Direct positional helper for Parent Journey Discovery:
 * findRoutesForJourney(institutionId, origin, destinationStop, routes)
 */
export function findRoutesForJourney(institutionId, origin, destinationStop, routes = []) {
  return findMatchingRoutes({
    routes,
    from: origin,
    to: destinationStop,
    institutionId
  });
}

/**
 * Resolves a matching route's real bus, schedule, and active trip state.
 */
export function resolveBusJourneyDetails({
  route,
  buses = [],
  schedules = [],
  activeTrips = [],
  liveLocations = {}
}) {
  if (!route) return null;

  // 1. Resolve assigned bus
  const assignedBus = buses.find(b => b.id === route.busId || b.routeId === route.id || b.assignedRouteId === route.id) || null;

  // 2. Resolve schedule
  const schedule = schedules.find(s => s.routeId === route.id || (assignedBus && s.busId === assignedBus.id)) || null;

  // 3. Resolve active trip
  const busId = assignedBus?.id || route.busId || null;
  const activeTrip = activeTrips.find(t => t.busId === busId || t.routeId === route.id) || null;

  // 4. Live location from RTDB map or bus record
  const liveLocation = busId ? (liveLocations[busId] || null) : null;

  // 5. Determine authentic state
  let state = 'SCHEDULED';
  const isTripActive = Boolean(
    (assignedBus && (assignedBus.status === 'ON_TRIP' || assignedBus.status === 'LIVE')) ||
    (activeTrip && activeTrip.status === 'ACTIVE') ||
    (liveLocation && liveLocation.active === true)
  );

  const isTripCompleted = Boolean(
    (assignedBus && assignedBus.status === 'COMPLETED') ||
    (activeTrip && activeTrip.status === 'COMPLETED')
  );

  if (isTripActive) {
    state = 'LIVE';
  } else if (isTripCompleted) {
    state = 'COMPLETED';
  } else if (!assignedBus && !route.busId) {
    state = 'NO_BUS_ASSIGNED';
  } else {
    state = 'SCHEDULED';
  }

  // 6. Departure & arrival times
  const departureTime = schedule?.departureTime || route.departureTime || '07:15 AM';
  const expectedArrival = schedule?.expectedArrival || route.expectedArrival || '08:15 AM';

  return {
    route,
    bus: assignedBus,
    busId,
    busNumber: assignedBus?.busNumber || route.busNumber || (busId ? busId : 'Unassigned'),
    registrationNumber: assignedBus?.registrationNumber || assignedBus?.busRegistrationNumber || '',
    capacity: assignedBus?.capacity || 52,
    driverName: assignedBus?.driverName || route.driverName || 'Assigned Operator',
    driverPhone: assignedBus?.driverPhone || '',
    schedule,
    activeTrip,
    tripId: activeTrip?.id || activeTrip?.tripId || assignedBus?.activeTripId || null,
    liveLocation,
    state,
    departureTime,
    expectedArrival,
    stops: route.stops || []
  };
}

// ---------------------------------------------------------------------------
// 11. INSTITUTIONS & PLATFORM ECOSYSTEM
// ---------------------------------------------------------------------------

export function subscribeInstitutions(callback) {
  const colRef = collection(db, 'institutions');
  return onSnapshot(
    colRef,
    (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(items);
      } else {
        callback(REGISTERED_INSTITUTIONS.map(inst => ({
          ...inst,
          verificationStatus: 'verified',
          status: 'active'
        })));
      }
    },
    (err) => {
      console.warn('subscribeInstitutions error, using registered corridor fallback:', err);
      callback(REGISTERED_INSTITUTIONS.map(inst => ({
        ...inst,
        verificationStatus: 'verified',
        status: 'active'
      })));
    }
  );
}

export async function createInstitution(instData) {
  const id = instData.id || `INST-${Date.now().toString().slice(-6)}`;
  const payload = {
    ...instData,
    id,
    status: instData.status || 'pending',
    verificationStatus: instData.verificationStatus || 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'institutions', id), payload, { merge: true });
  return payload;
}

export async function verifyInstitutionPlatform(institutionId, verificationStatus = 'verified', notes = '') {
  await updateDoc(doc(db, 'institutions', institutionId), {
    verificationStatus,
    status: verificationStatus === 'verified' ? 'active' : 'suspended',
    adminNotes: notes,
    verifiedAt: Date.now(),
    updatedAt: Date.now()
  });
}

// ---------------------------------------------------------------------------
// 12. DRIVER PROFILES, VERIFICATION & MARKETPLACE
// ---------------------------------------------------------------------------

export function subscribeDriverProfiles(callback) {
  const colRef = collection(db, 'driverProfiles');
  return onSnapshot(
    colRef,
    (snap) => {
      if (!snap.empty) {
        const profiles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(profiles);
      } else {
        callback(INITIAL_VERIFIED_DRIVERS);
      }
    },
    (err) => {
      console.warn('subscribeDriverProfiles error, using corridor drivers:', err);
      callback(INITIAL_VERIFIED_DRIVERS);
    }
  );
}

export async function saveDriverProfile(driverId, profileData) {
  if (!driverId) throw new Error('Driver ID is required to save profile.');
  const payload = {
    ...profileData,
    driverId,
    id: driverId,
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'driverProfiles', driverId), payload, { merge: true });
  // Also update user profile
  try {
    await updateDoc(doc(db, 'users', driverId), {
      ...payload,
      role: 'driver'
    });
  } catch {}
  return payload;
}

export async function submitDriverDocuments(driverId, documentData) {
  const updates = {
    documents: documentData,
    verificationStatus: 'pending',
    submittedAt: Date.now(),
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'driverProfiles', driverId), updates, { merge: true });
  try {
    await updateDoc(doc(db, 'users', driverId), {
      verificationStatus: 'pending'
    });
  } catch {}
}

export async function platformVerifyDriver(driverId, status = 'approved', adminNotes = '') {
  const updates = {
    verificationStatus: status,
    isPlatformVerified: status === 'approved',
    adminNotes,
    verifiedAt: Date.now(),
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'driverProfiles', driverId), updates, { merge: true });
  try {
    await updateDoc(doc(db, 'users', driverId), {
      verificationStatus: status
    });
  } catch {}
}

// ---------------------------------------------------------------------------
// 13. JOB MARKETPLACE (INSTITUTION REQUIREMENTS & DRIVER APPLICATIONS)
// ---------------------------------------------------------------------------

export function subscribeJobPostings(callback) {
  const colRef = collection(db, 'jobPostings');
  return onSnapshot(
    colRef,
    (snap) => {
      if (!snap.empty) {
        const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        jobs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        callback(jobs);
      } else {
        callback(INITIAL_JOBS);
      }
    },
    (err) => {
      console.warn('subscribeJobPostings note:', err);
      callback(INITIAL_JOBS);
    }
  );
}

export async function createJobPosting(jobData) {
  const id = jobData.id || `JOB-${Date.now().toString().slice(-4)}`;
  const payload = {
    ...jobData,
    id,
    status: 'OPEN',
    applicantsCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'jobPostings', id), payload, { merge: true });
  return payload;
}

export async function closeJobPosting(jobId) {
  await updateDoc(doc(db, 'jobPostings', jobId), {
    status: 'CLOSED',
    updatedAt: Date.now()
  });
}

export async function applyForJob(driverId, jobId, applicationData) {
  const appId = `APP-${driverId}-${jobId}`;
  const payload = {
    ...applicationData,
    id: appId,
    driverId,
    jobId,
    status: 'APPLIED', // APPLIED | REVIEWING | SHORTLISTED | SELECTED | REJECTED
    appliedAt: Date.now(),
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'jobApplications', appId), payload, { merge: true });

  // Increment applicants count
  try {
    const jobRef = doc(db, 'jobPostings', jobId);
    const jobSnap = await getDoc(jobRef);
    if (jobSnap.exists()) {
      const currentCount = jobSnap.data().applicantsCount || 0;
      await updateDoc(jobRef, { applicantsCount: currentCount + 1 });
    }
  } catch {}

  return payload;
}

export function subscribeJobApplications(callback, filterKey = null, filterVal = null) {
  const colRef = collection(db, 'jobApplications');
  return onSnapshot(
    colRef,
    (snap) => {
      let apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (filterKey && filterVal) {
        apps = apps.filter(a => a[filterKey] === filterVal);
      }
      callback(apps);
    },
    (err) => {
      console.warn('subscribeJobApplications error:', err);
      callback([]);
    }
  );
}

export async function updateJobApplicationStatus(applicationId, status, hiringDetails = {}) {
  const updates = {
    status,
    ...hiringDetails,
    updatedAt: Date.now()
  };
  await updateDoc(doc(db, 'jobApplications', applicationId), updates);

  // If driver was selected / hired, automatically connect driver profile to institution
  if (status === 'SELECTED' && hiringDetails.institutionId && hiringDetails.driverId) {
    await setDoc(doc(db, 'driverProfiles', hiringDetails.driverId), {
      hiredByInstitutionId: hiringDetails.institutionId,
      hiredByInstitutionName: hiringDetails.institutionName || 'Institution',
      availability: 'BUSY',
      updatedAt: Date.now()
    }, { merge: true });

    try {
      await updateDoc(doc(db, 'users', hiringDetails.driverId), {
        institutionId: hiringDetails.institutionId,
        institutionName: hiringDetails.institutionName || 'Institution'
      });
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// 14. DRIVER INVITATIONS (INSTITUTION DIRECT RECRUITMENT)
// ---------------------------------------------------------------------------

export async function sendDriverInvitation(invitationData) {
  const id = `INV-${Date.now().toString().slice(-6)}`;
  const payload = {
    ...invitationData,
    id,
    status: 'PENDING', // PENDING | ACCEPTED | DECLINED
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await setDoc(doc(db, 'driverInvitations', id), payload);
  return payload;
}

export function subscribeDriverInvitations(driverId, callback) {
  const colRef = collection(db, 'driverInvitations');
  return onSnapshot(
    colRef,
    (snap) => {
      let invs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (driverId) {
        invs = invs.filter(i => i.driverId === driverId);
      }
      callback(invs);
    },
    (err) => {
      console.warn('subscribeDriverInvitations note:', err);
      callback([]);
    }
  );
}

export async function respondToDriverInvitation(invitationId, responseStatus = 'ACCEPTED', details = {}) {
  await updateDoc(doc(db, 'driverInvitations', invitationId), {
    status: responseStatus,
    respondedAt: Date.now(),
    updatedAt: Date.now()
  });

  // If accepted, connect driver to the institution
  if (responseStatus === 'ACCEPTED' && details.driverId && details.institutionId) {
    await setDoc(doc(db, 'driverProfiles', details.driverId), {
      hiredByInstitutionId: details.institutionId,
      hiredByInstitutionName: details.institutionName || 'Institution',
      availability: 'BUSY',
      updatedAt: Date.now()
    }, { merge: true });
  }
}

// ---------------------------------------------------------------------------
// 15. OPERATIONAL ASSIGNMENT (CONNECTING DRIVER TO BUS & ROUTE)
// ---------------------------------------------------------------------------

export async function assignDriverAndRouteToBus(busId, driverId, routeId, institutionId) {
  const batch = writeBatch(db);

  // 1. Fetch driver details
  let driverName = 'Driver';
  let driverPhone = '';
  try {
    const dSnap = await getDoc(doc(db, 'driverProfiles', driverId));
    if (dSnap.exists()) {
      const d = dSnap.data();
      driverName = d.fullName || d.name || driverName;
      driverPhone = d.phone || '';
    }
  } catch {}

  // 2. Fetch route details
  let routeName = 'Route';
  try {
    const rSnap = await getDoc(doc(db, 'routes', routeId));
    if (rSnap.exists()) {
      routeName = rSnap.data().routeName || rSnap.data().name || routeName;
    }
  } catch {}

  // 3. Update Bus
  batch.update(doc(db, 'buses', busId), {
    driverId,
    driverName,
    driverPhone,
    routeId,
    routeName,
    status: 'ASSIGNED',
    institutionId: institutionId || 'INST-ABC-SCHOOL',
    updatedAt: Date.now()
  });

  // 4. Update Driver Profile
  batch.set(doc(db, 'driverProfiles', driverId), {
    assignedBusId: busId,
    assignedRouteId: routeId,
    assignedRouteName: routeName,
    hiredByInstitutionId: institutionId || 'INST-ABC-SCHOOL',
    updatedAt: Date.now()
  }, { merge: true });

  // 5. Update Route
  batch.update(doc(db, 'routes', routeId), {
    busId,
    assignedBusId: busId,
    driverId,
    driverName,
    status: 'ACTIVE',
    updatedAt: Date.now()
  });

  await batch.commit();
}

// ---------------------------------------------------------------------------
// 16. STUDENT & PARENT JOURNEY DISCOVERY SERVICE
// ---------------------------------------------------------------------------

export function subscribeParentStudents(parentId, parentEmail, callback) {
  if (!parentId && !parentEmail) {
    callback([]);
    return () => {};
  }

  const q = collection(db, 'students');
  return onSnapshot(
    q,
    (snap) => {
      const allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      let matched = allStudents.filter(s => 
        (parentId && (s.parentId === parentId || s.parentUid === parentId)) ||
        (parentEmail && s.parentEmail?.toLowerCase() === parentEmail?.toLowerCase())
      );

      // If no Firestore records found yet, check INITIAL_STUDENTS for matching email or demo fallback
      if (matched.length === 0 && (parentEmail || parentId)) {
        const fallbackMatched = INITIAL_STUDENTS.filter(s =>
          (parentEmail && s.parentEmail?.toLowerCase() === parentEmail?.toLowerCase()) ||
          (parentId && (s.parentId === parentId || s.parentUid === parentId))
        );
        if (fallbackMatched.length > 0) {
          matched = fallbackMatched;
        }
      }

      callback(matched);
    },
    (err) => {
      console.warn('subscribeParentStudents error:', err);
      const fallbackMatched = INITIAL_STUDENTS.filter(s =>
        (parentEmail && s.parentEmail?.toLowerCase() === parentEmail?.toLowerCase()) ||
        (parentId && s.parentId === parentId)
      );
      callback(fallbackMatched);
    }
  );
}

export function subscribeInstitutionStudents(institutionId, callback) {
  if (!institutionId) {
    callback([]);
    return () => {};
  }

  const q = collection(db, 'students');
  return onSnapshot(
    q,
    (snap) => {
      let students = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.institutionId === institutionId);

      if (students.length === 0) {
        students = INITIAL_STUDENTS.filter(s => s.institutionId === institutionId);
      }
      callback(students);
    },
    (err) => {
      console.warn('subscribeInstitutionStudents note:', err);
      callback(INITIAL_STUDENTS.filter(s => s.institutionId === institutionId));
    }
  );
}

export async function saveStudentAssociation(studentData) {
  const studentId = studentData.id || ('STU-' + Date.now());
  const now = Date.now();
  const payload = {
    ...studentData,
    id: studentId,
    updatedAt: now
  };
  if (!studentData.id) {
    payload.createdAt = now;
  }
  await setDoc(doc(db, 'students', studentId), payload, { merge: true });
  return payload;
}
