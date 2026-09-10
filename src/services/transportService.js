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
  onSnapshot
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
import { INITIAL_VEHICLES, INITIAL_ROUTES, REGISTERED_INSTITUTIONS } from '../data/regionData';

// ---------------------------------------------------------------------------
// 1. DATABASE BOOTSTRAP / SEED
// ---------------------------------------------------------------------------

export async function ensureInitialCorridorData() {
  try {
    // Check if buses exist in Firestore
    const busesSnap = await getDocs(collection(db, 'buses'));
    if (busesSnap.empty) {
      console.log('Seeding initial buses into Firestore...');
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

    // Check if routes exist in Firestore
    const routesSnap = await getDocs(collection(db, 'routes'));
    if (routesSnap.empty) {
      console.log('Seeding initial routes into Firestore...');
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
    console.warn('Initial corridor data check/seed note:', err?.message || err);
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
    name: driverData.name || driverData.fullName || 'Driver Applicant',
    fullName: driverData.fullName || driverData.name || 'Driver Applicant',
    email: driverData.email || '',
    phone: driverData.phone || '',
    busNumber: driverData.busNumber || 'Bus 24',
    from: driverData.from || 'Vizianagaram',
    to: driverData.to || 'Visakhapatnam',
    pincode: driverData.pincode || '',
    locality: driverData.locality || '',
    district: driverData.district || '',
    institutionId: driverData.institutionId || '',
    institutionName: driverData.institutionName || '',
    licenceNumber: driverData.licenceNumber || '',
    licenceValidity: driverData.licenceValidity || '',
    idDocumentType: driverData.idDocumentType || 'Aadhaar Card',
    idDocumentNumber: driverData.idDocumentNumber || '',
    idDocValidity: driverData.idDocValidity || 'Permanent',
    experienceYears: driverData.experienceYears || '5+ Years',
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

export async function approveDriverApplication(appId, driverId, busId = null, routeId = null, adminUid = 'admin') {
  const now = Date.now();
  const effectiveBusId = busId || 'BUS-24';
  const effectiveRouteId = routeId || 'ROUTE-VZ04';

  const updates = {
    status: 'approved',
    verificationStatus: 'approved',
    reviewedAt: now,
    reviewedBy: adminUid,
    assignedBusId: effectiveBusId,
    assignedRouteId: effectiveRouteId,
    busId: effectiveBusId,
    routeId: effectiveRouteId,
    rejectionReason: null
  };

  // Update application
  try {
    await updateDoc(doc(db, 'driverApplications', appId), updates);
  } catch (e) {
    console.warn('Driver application update note:', e);
  }

  // Fetch application details to get name and phone
  let driverName = 'Verified Driver';
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

  // Update driver user document
  const targetUid = driverId || appId;
  const userUpdates = {
    status: 'approved',
    verificationStatus: 'approved',
    reviewedAt: now,
    reviewedBy: adminUid,
    busId: effectiveBusId,
    assignedBusId: effectiveBusId,
    busNumber: 'Bus 24',
    routeId: effectiveRouteId,
    assignedRouteId: effectiveRouteId,
    routeName: 'Route 04 (Vizianagaram -> Visakhapatnam)',
    rejectionReason: null
  };

  await saveUserProfile(targetUid, userUpdates);

  // Assign driver to the bus if busId is specified
  if (effectiveBusId) {
    try {
      await updateDoc(doc(db, 'buses', effectiveBusId), {
        driverId: targetUid,
        driverName,
        driverPhone,
        routeId: effectiveRouteId,
        status: 'ASSIGNED',
        updatedAt: now
      });
    } catch (e) {
      console.warn('Bus update note:', e);
    }
  }

  // Update route with assigned driver and bus if routeId is specified
  if (effectiveRouteId) {
    try {
      await updateDoc(doc(db, 'routes', effectiveRouteId), {
        driverId: targetUid,
        driverName,
        busId: effectiveBusId,
        updatedAt: now
      });
    } catch (e) {
      console.warn('Route update note:', e);
    }
  }
}

export async function rejectDriverApplication(appId, driverId, rejectionReason, adminUid = 'admin') {
  const now = Date.now();
  const reasonText = (rejectionReason || '').trim() || 'Application credentials could not be verified by transport administration.';
  const updates = {
    status: 'rejected',
    verificationStatus: 'rejected',
    reviewedAt: now,
    reviewedBy: adminUid,
    rejectionReason: reasonText
  };

  await updateDoc(doc(db, 'driverApplications', appId), updates);

  const targetUid = driverId || appId;
  await saveUserProfile(targetUid, {
    status: 'rejected',
    verificationStatus: 'rejected',
    rejectionReason: reasonText,
    reviewedAt: now,
    reviewedBy: adminUid
  });
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

export async function startDriverTrip({ busId, routeId, driverInfo, initialCoords }) {
  if (!busId) throw new Error('No bus assigned for trip.');
  const lat = Number(initialCoords.latitude);
  const lng = Number(initialCoords.longitude);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Invalid GPS coordinates received from device.');
  }

  const tripId = `TRIP-${busId}-${Date.now()}`;
  const now = Date.now();

  const tripPayload = {
    tripId,
    id: tripId,
    driverId: driverInfo.uid || driverInfo.driverId || '',
    driverName: driverInfo.name || driverInfo.fullName || 'Assigned Driver',
    driverPhone: driverInfo.phone || '',
    busId,
    busNumber: driverInfo.busNumber || 'Bus',
    registrationNumber: driverInfo.busRegistrationNumber || '',
    routeId: routeId || '',
    routeName: driverInfo.routeName || '',
    status: 'ACTIVE',
    startedAt: now,
    endedAt: null,
    startedLocation: { latitude: lat, longitude: lng },
    currentLocation: { latitude: lat, longitude: lng, accuracy: initialCoords.accuracy || 10 },
    lastLocationUpdate: now
  };

  // 1. Create Firestore trip
  await setDoc(doc(db, 'trips', tripId), tripPayload);

  // 2. Update Firestore bus
  await updateDoc(doc(db, 'buses', busId), {
    status: 'ON_TRIP',
    activeTripId: tripId,
    latitude: lat,
    longitude: lng,
    accuracy: initialCoords.accuracy || 10,
    speed: initialCoords.speed || 0,
    heading: initialCoords.heading || 0,
    lastUpdated: now,
    updatedAt: now
  });

  // 3. Publish to Realtime Database `liveLocations/${tripId}`
  const rtdbPayload = {
    tripId,
    busId,
    busNumber: driverInfo.busNumber || 'Bus',
    registrationNumber: driverInfo.busRegistrationNumber || '',
    routeId: routeId || '',
    routeName: driverInfo.routeName || '',
    driverId: driverInfo.uid || '',
    driverName: driverInfo.name || driverInfo.fullName || '',
    driverPhone: driverInfo.phone || '',
    latitude: lat,
    longitude: lng,
    accuracy: initialCoords.accuracy || 10,
    speed: initialCoords.speed || 0,
    heading: initialCoords.heading || 0,
    timestamp: now,
    active: true
  };

  await rtdbSet(rtdbRef(rtdb, `liveLocations/${tripId}`), rtdbPayload);
  await rtdbSet(rtdbRef(rtdb, `busLocations/${busId}`), rtdbPayload);

  // 4. Send start message to bus channel
  await rtdbPush(rtdbRef(rtdb, `messages/${busId}`), {
    senderId: driverInfo.uid || 'driver-sys',
    senderName: driverInfo.name || 'Driver',
    senderRole: 'driver',
    message: '🚌 Trip Started: Live GPS tracking is now streaming from the bus.',
    timestamp: now,
    isSystemMessage: true
  });

  return tripPayload;
}

let lastFirestoreSync = 0;
export async function streamDriverGpsLocation({ tripId, busId, coords }) {
  if (!tripId || !busId) return;
  const lat = Number(coords.latitude);
  const lng = Number(coords.longitude);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
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
    active: true
  };

  try {
    // 1. High-frequency update to RTDB
    await rtdbUpdate(rtdbRef(rtdb, `liveLocations/${tripId}`), updatePayload);
    await rtdbUpdate(rtdbRef(rtdb, `busLocations/${busId}`), updatePayload);

    // 2. Low-frequency throttle to Firestore
    if (now - lastFirestoreSync > 20000) {
      lastFirestoreSync = now;
      await updateDoc(doc(db, 'buses', busId), {
        latitude: lat,
        longitude: lng,
        accuracy: Math.round(coords.accuracy || 5),
        speed: coords.speed || 0,
        heading: coords.heading || 0,
        lastUpdated: now
      });
      await updateDoc(doc(db, 'trips', tripId), {
        currentLocation: { latitude: lat, longitude: lng, accuracy: coords.accuracy || 5 },
        lastLocationUpdate: now
      });
    }
  } catch (err) {
    console.warn('streamDriverGpsLocation error:', err?.message || err);
  }
}

export async function endDriverTrip({ tripId, busId, driverInfo, finalCoords }) {
  const now = Date.now();

  let finalLat = null;
  let finalLng = null;
  if (finalCoords && !isNaN(finalCoords.latitude) && !isNaN(finalCoords.longitude)) {
    finalLat = Number(finalCoords.latitude);
    finalLng = Number(finalCoords.longitude);
  }

  let durationMinutes = 0;
  let startedAt = now;
  let routeName = '';
  let busNumber = '';
  if (tripId) {
    try {
      const tripSnap = await getDoc(doc(db, 'trips', tripId));
      if (tripSnap.exists()) {
        const tripData = tripSnap.data();
        startedAt = tripData.startedAt || now;
        durationMinutes = Math.max(1, Math.round((now - startedAt) / 60000));
        routeName = tripData.routeName || '';
        busNumber = tripData.busNumber || '';
      }
    } catch (e) {
      console.warn('Could not read trip doc for summary:', e);
    }
  }

  const completedData = {
    status: 'COMPLETED',
    endedAt: now,
    endedLocation: finalLat && finalLng ? { latitude: finalLat, longitude: finalLng } : null,
    durationMinutes
  };

  if (tripId) {
    await updateDoc(doc(db, 'trips', tripId), completedData);

    await setDoc(doc(db, 'tripHistory', tripId), {
      tripId,
      busId,
      busNumber: busNumber || driverInfo?.busNumber || 'Bus',
      driverId: driverInfo?.uid || driverInfo?.driverId || '',
      driverName: driverInfo?.name || driverInfo?.fullName || 'Driver',
      driverPhone: driverInfo?.phone || '',
      routeName: routeName || driverInfo?.routeName || '',
      startedAt,
      endedAt: now,
      durationMinutes,
      createdAt: now
    });
  }

  if (busId) {
    await updateDoc(doc(db, 'buses', busId), {
      status: 'AVAILABLE',
      activeTripId: null,
      updatedAt: now
    });
  }

  if (tripId) {
    await rtdbUpdate(rtdbRef(rtdb, `liveLocations/${tripId}`), {
      active: false,
      endedAt: now
    });
  }
  if (busId) {
    await rtdbUpdate(rtdbRef(rtdb, `busLocations/${busId}`), {
      active: false,
      endedAt: now
    });
  }

  if (busId) {
    await rtdbPush(rtdbRef(rtdb, `messages/${busId}`), {
      senderId: driverInfo?.uid || 'driver-sys',
      senderName: driverInfo?.name || 'Driver',
      senderRole: 'driver',
      message: "🏁 Trip Completed: Today's bus run has concluded safely.",
      timestamp: now,
      isSystemMessage: true
    });
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

