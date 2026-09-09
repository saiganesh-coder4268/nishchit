/**
 * Transport Service & Authority Layer for Nishchit.
 * Manages Firebase Realtime DB sync with instant optimistic local cache.
 */

import { ref, get, set, update, push, onValue } from 'firebase/database';
import { database } from '../firebase';
import { 
  REGISTERED_INSTITUTIONS, 
  INITIAL_VEHICLES, 
  INITIAL_ROUTES, 
  INITIAL_STUDENTS 
} from '../data/regionData';

const SEED_VERSION_KEY = 'nishchit_seed_v2';

/**
 * Initialize / Seed default institutions, fleet, and routes in Firebase Realtime DB.
 */
export async function seedTransportDatabase() {
  try {
    const isSeeded = localStorage.getItem(SEED_VERSION_KEY);
    const instRef = ref(database, 'institutions');
    const snapshot = await get(instRef);

    if (!snapshot.exists() || !isSeeded) {
      // Seed institutions
      const instMap = {};
      REGISTERED_INSTITUTIONS.forEach(i => { instMap[i.id] = i; });
      await set(ref(database, 'institutions'), instMap);

      // Seed buses
      const busMap = {};
      INITIAL_VEHICLES.forEach(b => { busMap[b.id] = b; });
      await set(ref(database, 'buses'), busMap);

      // Seed routes
      const routeMap = {};
      INITIAL_ROUTES.forEach(r => { routeMap[r.id] = r; });
      await set(ref(database, 'routes'), routeMap);

      // Seed students
      const stuMap = {};
      INITIAL_STUDENTS.forEach(s => { stuMap[s.id] = s; });
      await set(ref(database, 'students'), stuMap);

      localStorage.setItem(SEED_VERSION_KEY, 'true');
      console.log("Nishchit corridor transport database successfully initialized.");
    }
  } catch (err) {
    console.warn("Transport database seeding note:", err?.message || err);
  }
}

/**
 * Subscribe to all buses / fleet state
 */
export function subscribeFleet(callback) {
  const busesRef = ref(database, 'buses');
  return onValue(busesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
      callback(list);
    } else {
      callback(INITIAL_VEHICLES);
    }
  }, (err) => {
    console.warn("Fleet subscription fallback to local cache:", err);
    callback(INITIAL_VEHICLES);
  });
}

/**
 * Subscribe to single bus by ID
 */
export function subscribeSingleBus(busId, callback) {
  if (!busId) return () => {};
  const busRef = ref(database, `buses/${busId}`);
  return onValue(busRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: busId, ...snapshot.val() });
    } else {
      const defaultBus = INITIAL_VEHICLES.find(b => b.id === busId) || INITIAL_VEHICLES[0];
      callback(defaultBus);
    }
  }, () => {
    const defaultBus = INITIAL_VEHICLES.find(b => b.id === busId) || INITIAL_VEHICLES[0];
    callback(defaultBus);
  });
}

/**
 * Subscribe to Driver Verification Applications
 */
export function subscribeDriverApplications(callback) {
  const appsRef = ref(database, 'driverApplications');
  return onValue(appsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
      callback(list);
    } else {
      callback([]);
    }
  });
}

/**
 * Submit Driver Onboarding & Verification Application
 */
export async function submitDriverApplication(driverData) {
  const appId = driverData.uid || 'DRV-' + Date.now();
  const applicationPayload = {
    driverId: appId,
    uid: driverData.uid || appId,
    fullName: driverData.fullName || driverData.name,
    phone: driverData.phone,
    email: driverData.email,
    pincode: driverData.pincode,
    locality: driverData.locality,
    district: driverData.district,
    institutionId: driverData.institutionId,
    institutionName: driverData.institutionName,
    photoUrl: driverData.photoUrl || '',
    licenceNumber: driverData.licenceNumber,
    licenceValidity: driverData.licenceValidity,
    licenceDocUrl: driverData.licenceDocUrl || '',
    idDocumentType: driverData.idDocumentType || 'Aadhaar Card',
    idDocumentNumber: driverData.idDocumentNumber || '',
    idDocValidity: driverData.idDocValidity || 'Lifetime / Permanent',
    idDocUrl: driverData.idDocUrl || '',
    experienceYears: driverData.experienceYears || '3-5 years',
    verificationStatus: 'PENDING',
    submittedAt: Date.now(),
    assignedBusId: null,
    assignedRouteId: null
  };

  try {
    await set(ref(database, `driverApplications/${appId}`), applicationPayload);
    await update(ref(database, `users/${appId}`), {
      ...applicationPayload,
      role: 'driver',
      verificationStatus: 'PENDING'
    });
  } catch (err) {
    console.error("Failed to submit driver application to RTDB:", err);
  }

  // Update local session
  const stored = localStorage.getItem('nishchit_demo_user');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.uid === appId) {
        localStorage.setItem('nishchit_demo_user', JSON.stringify({ ...parsed, ...applicationPayload }));
      }
    } catch {
      // ignore
    }
  }

  return applicationPayload;
}

/**
 * Admin Action: Approve Driver Application & Assign Vehicle & Route
 */
export async function approveDriverApplication(driverId, busId = "BUS-24", routeId = "ROUTE-VZ04") {
  const updates = {
    verificationStatus: 'APPROVED',
    assignedBusId: busId,
    assignedRouteId: routeId,
    approvedAt: Date.now()
  };

  try {
    await update(ref(database, `driverApplications/${driverId}`), updates);
    await update(ref(database, `users/${driverId}`), {
      ...updates,
      busId,
      routeId
    });

    // Update the bus record with the assigned driver
    const appSnap = await get(ref(database, `driverApplications/${driverId}`));
    const driverName = appSnap.exists() ? appSnap.val().fullName : 'Assigned Driver';
    const driverPhone = appSnap.exists() ? appSnap.val().phone : '';

    await update(ref(database, `buses/${busId}`), {
      driverId,
      driverName,
      driverPhone,
      routeId
    });
  } catch (err) {
    console.error("Error approving driver application:", err);
  }

  // Also update local storage if it's the current user session
  const stored = localStorage.getItem('nishchit_demo_user');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.uid === driverId || parsed.driverId === driverId) {
        localStorage.setItem('nishchit_demo_user', JSON.stringify({
          ...parsed,
          verificationStatus: 'APPROVED',
          busId,
          routeId
        }));
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Admin Action: Reject Driver Application
 */
export async function rejectDriverApplication(driverId, rejectionReason = "Documentation validity expired.") {
  const updates = {
    verificationStatus: 'REJECTED',
    rejectionReason,
    rejectedAt: Date.now()
  };

  try {
    await update(ref(database, `driverApplications/${driverId}`), updates);
    await update(ref(database, `users/${driverId}`), updates);
  } catch (err) {
    console.error("Error rejecting driver application:", err);
  }
}

/**
 * Driver Action: Start Trip with Real Geolocation Coordinates
 */
export async function startDriverTrip(busId, driverInfo, initialCoords) {
  const startTime = Date.now();
  const payload = {
    status: 'LIVE',
    latitude: Number(initialCoords.latitude),
    longitude: Number(initialCoords.longitude),
    accuracy: Math.round(initialCoords.accuracy || 10),
    speed: initialCoords.speed || 0,
    heading: initialCoords.heading || 0,
    startedAt: startTime,
    endedAt: null,
    lastUpdated: startTime,
    driverId: driverInfo.driverId || driverInfo.uid || 'DRV-901',
    driverName: driverInfo.fullName || driverInfo.name || 'Rajesh Kumar',
    driverPhone: driverInfo.phone || '+91 98765 43210'
  };

  try {
    await update(ref(database, `buses/${busId}`), payload);
    // Broadcast trip started message
    await push(ref(database, `messages/${busId}`), {
      senderId: driverInfo.uid || 'driver-sys',
      senderName: driverInfo.name || 'Driver',
      senderRole: 'driver',
      message: `🚌 Trip Started: Bus is now LIVE on route. GPS tracking is active.`,
      timestamp: startTime,
      isSystemMessage: true
    });
  } catch (err) {
    console.warn("Realtime DB trip start error, synced locally:", err);
  }

  return payload;
}

/**
 * Driver Action: Stream Continuous GPS Updates
 */
export async function updateDriverGpsLocation(busId, coords) {
  const updatePayload = {
    status: 'LIVE',
    latitude: Number(coords.latitude),
    longitude: Number(coords.longitude),
    accuracy: Math.round(coords.accuracy || 5),
    speed: coords.speed || 0,
    heading: coords.heading || 0,
    lastUpdated: Date.now()
  };

  try {
    await update(ref(database, `buses/${busId}`), updatePayload);
  } catch (err) {
    // Silent fail for high frequency GPS streams
  }
}

/**
 * Driver Action: End Trip
 */
export async function endDriverTrip(busId, driverInfo) {
  const endTime = Date.now();
  const payload = {
    status: 'COMPLETED',
    endedAt: endTime,
    lastUpdated: endTime
  };

  try {
    await update(ref(database, `buses/${busId}`), payload);
    // Broadcast trip ended notification
    await push(ref(database, `messages/${busId}`), {
      senderId: driverInfo?.uid || 'driver-sys',
      senderName: driverInfo?.name || 'Driver',
      senderRole: 'driver',
      message: `🏁 Trip Completed: Today's bus run has concluded safely.`,
      timestamp: endTime,
      isSystemMessage: true
    });
  } catch (err) {
    console.warn("Realtime DB end trip error:", err);
  }

  return payload;
}

/**
 * Subscribe to Reports / Incidents Desk
 */
export function subscribeIncidentReports(callback) {
  const reportsRef = ref(database, 'reports');
  return onValue(reportsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
      callback(list.sort((a, b) => b.timestamp - a.timestamp));
    } else {
      callback([]);
    }
  });
}

/**
 * Submit Parent / Driver Incident Report
 */
export async function submitIncidentReport(report) {
  const payload = {
    ...report,
    timestamp: Date.now(),
    status: 'OPEN'
  };

  try {
    await push(ref(database, 'reports'), payload);
  } catch (err) {
    console.error("Error reporting incident:", err);
  }

  return payload;
}
