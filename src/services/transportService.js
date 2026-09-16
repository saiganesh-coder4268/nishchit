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
// 1. INSTITUTES ENTITY & DATABASE BOOTSTRAP
// ---------------------------------------------------------------------------

export const SUPPORTED_INSTITUTES = [
  {
    id: "INST-AU",
    instituteId: "INST-AU",
    institutionId: "INST-AU",
    name: "Andhra University",
    shortName: "Andhra University",
    campus: "Waltair Uplands / Siripuram Campus, Visakhapatnam",
    location: "Waltair Uplands, Siripuram",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    district: "Visakhapatnam",
    pincode: "530003",
    status: "ACTIVE",
    busesCount: 28,
    createdAt: 1700000000000
  },
  {
    id: "INST-GITAM",
    instituteId: "INST-GITAM",
    institutionId: "INST-GITAM",
    name: "GITAM (Deemed to be University)",
    shortName: "GITAM University",
    campus: "Rushikonda Campus, Visakhapatnam",
    location: "Rushikonda",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    district: "Visakhapatnam",
    pincode: "530045",
    status: "ACTIVE",
    busesCount: 35,
    createdAt: 1700000000000
  },
  {
    id: "INST-MVGR",
    instituteId: "INST-MVGR",
    institutionId: "INST-MVGR",
    name: "MVGR College of Engineering (Autonomous)",
    shortName: "MVGR College",
    campus: "Chintalavalasa Campus, Vizianagaram",
    location: "Chintalavalasa",
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    country: "India",
    district: "Vizianagaram",
    pincode: "535216",
    status: "ACTIVE",
    busesCount: 18,
    createdAt: 1700000000000
  }
];

/**
 * Ensures supported institutes exist in Firestore 'institutes' collection.
 */
export async function ensureSupportedInstitutes() {
  try {
    for (const inst of SUPPORTED_INSTITUTES) {
      await setDoc(doc(db, 'institutes', inst.id), {
        ...inst,
        updatedAt: Date.now()
      }, { merge: true });
    }
  } catch (err) {
    console.warn('ensureSupportedInstitutes note:', err);
  }
}

/**
 * Realtime subscription to supported active institutes in Firestore.
 */
export function subscribeInstitutes(callback) {
  const colRef = collection(db, 'institutes');
  return onSnapshot(
    colRef,
    (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => i.status === 'ACTIVE');
        callback(items);
      } else {
        callback(SUPPORTED_INSTITUTES);
        ensureSupportedInstitutes();
      }
    },
    (err) => {
      console.warn('subscribeInstitutes note:', err);
      callback(SUPPORTED_INSTITUTES);
    }
  );
}

export async function getInstitutes() {
  try {
    const snap = await getDocs(collection(db, 'institutes'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => i.status === 'ACTIVE');
    }
  } catch (e) {
    console.warn('getInstitutes note:', e);
  }
  return SUPPORTED_INSTITUTES;
}

export async function getInstitute(instituteId) {
  if (!instituteId) return null;
  try {
    const snap = await getDoc(doc(db, 'institutes', instituteId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (e) {
    console.warn('getInstitute note:', e);
  }
  return SUPPORTED_INSTITUTES.find(i => i.id === instituteId || i.instituteId === instituteId) || null;
}

/**
 * Bootstrap environment guarantee
 */
export async function ensureInitialCorridorData() {
  await ensureSupportedInstitutes();
  return Promise.resolve();
}

/**
 * Explicit Administrative Seed Function
 */
export async function seedDemoCorridorData() {
  try {
    await ensureSupportedInstitutes();

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

  // 1. Save application document in Firestore (both driverApplications and driverVerificationRequests)
  await setDoc(doc(db, 'driverApplications', appId), applicationPayload);
  try {
    await setDoc(doc(db, 'driverVerificationRequests', appId), applicationPayload);
  } catch (e) {
    console.warn('driverVerificationRequests sync note:', e);
  }

  // 2. Update user profile
  await saveUserProfile(driverData.uid || appId, {
    role: 'driver',
    status: 'pending',
    verificationStatus: 'pending',
    ...applicationPayload
  });

  return applicationPayload;
}

export const submitDriverVerificationRequest = submitDriverApplication;

export function subscribeDriverApplications(callback, institutionId = null) {
  const q = collection(db, 'driverApplications');
  return onSnapshot(
    q,
    (snap) => {
      let apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      apps.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
      if (institutionId) {
        apps = apps.filter(a => a.institutionId === institutionId || a.instituteId === institutionId);
      }
      callback(apps);
    },
    (err) => {
      console.warn('subscribeDriverApplications error:', err);
      callback([]);
    }
  );
}

export const subscribeDriverVerificationRequests = subscribeDriverApplications;

export async function getDriverProfile(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'drivers', uid));
    if (snap.exists()) return { uid: snap.id, ...snap.data() };
  } catch (e) {
    console.warn('getDriverProfile note:', e);
  }
  return null;
}

export function subscribeDriverProfile(uid, callback) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'drivers', uid),
    (snap) => {
      callback(snap.exists() ? { uid: snap.id, ...snap.data() } : null);
    },
    (err) => {
      console.warn('subscribeDriverProfile note:', err);
      callback(null);
    }
  );
}

export async function approveDriverApplication(appId, arg2, arg3, arg4, arg5, arg6) {
  let driverId, busId, routeId, adminUid, options;
  if (typeof arg2 === 'object' && arg2 !== null) {
    driverId = arg2.driverId || appId;
    busId = arg2.busId;
    routeId = arg2.routeId;
    adminUid = arg2.approvedBy || arg2.adminUid || 'admin';
    options = arg2;
  } else {
    driverId = arg2 || appId;
    busId = arg3;
    routeId = arg4;
    adminUid = arg5 || 'admin';
    options = arg6 || {};
  }

  if (!busId || !routeId) {
    throw new Error('Both a valid Bus and Route must be explicitly assigned to approve driver.');
  }

  const now = Date.now();
  const targetUid = driverId || appId;
  const institutionId = options.institutionId || options.instituteId || 'INST-AU';
  const institutionName = options.institutionName || 'Andhra University';

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
  const appUpdateData = {
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
    institutionId,
    instituteId: institutionId,
    institutionName,
    scheduleId: options.scheduleId || null,
    rejectionReason: null
  };
  batch.update(doc(db, 'driverApplications', appId), appUpdateData);
  try {
    batch.set(doc(db, 'driverVerificationRequests', appId), appUpdateData, { merge: true });
  } catch (e) {
    console.warn('driverVerificationRequests update note:', e);
  }

  // 2. Update user profile
  batch.set(
    doc(db, 'users', targetUid),
    {
      role: 'driver',
      status: 'active',
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
      institutionId,
      instituteId: institutionId,
      institutionName,
      scheduleId: options.scheduleId || null,
      rejectionReason: null,
      updatedAt: now
    },
    { merge: true }
  );

  // 3. Create or update driver profile document in drivers/{targetUid}
  batch.set(
    doc(db, 'drivers', targetUid),
    {
      uid: targetUid,
      name: driverName,
      fullName: driverName,
      phone: driverPhone,
      instituteId: institutionId,
      instituteName,
      assignedBusId: busId,
      assignedBusNumber: busNumber,
      assignedRouteId: routeId,
      assignedRouteName: routeName,
      busId,
      busNumber,
      routeId,
      routeName,
      verificationStatus: 'approved',
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    { merge: true }
  );

  // 4. Update bus
  batch.update(doc(db, 'buses', busId), {
    driverId: targetUid,
    driverName,
    driverPhone,
    routeId,
    routeName,
    institutionId,
    instituteId: institutionId,
    institutionName,
    status: 'ASSIGNED',
    updatedAt: now
  });

  // 5. Update route
  batch.update(doc(db, 'routes', routeId), {
    driverId: targetUid,
    driverName,
    busId,
    busNumber,
    institutionId,
    instituteId: institutionId,
    institutionName,
    updatedAt: now
  });

  await batch.commit();
}

export const approveDriverVerificationRequest = approveDriverApplication;

export async function rejectDriverApplication(appId, driverId, rejectionReason, adminUid = 'admin') {
  const reasonText = (rejectionReason || '').trim();
  if (!reasonText) {
    throw new Error('A rejection reason must be provided to reject an application.');
  }

  const now = Date.now();
  const targetUid = driverId || appId;

  const batch = writeBatch(db);

  const rejectData = {
    status: 'rejected',
    verificationStatus: 'rejected',
    reviewedAt: now,
    reviewedBy: adminUid,
    rejectionReason: reasonText
  };

  batch.update(doc(db, 'driverApplications', appId), rejectData);
  try {
    batch.set(doc(db, 'driverVerificationRequests', appId), rejectData, { merge: true });
  } catch (e) {
    console.warn('driverVerificationRequests reject sync note:', e);
  }

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

export const rejectDriverVerificationRequest = rejectDriverApplication;

// ---------------------------------------------------------------------------
// 3B. PARENT-STUDENT TRANSPORT LINKING
// ---------------------------------------------------------------------------

export async function linkParentStudentTransport(parentUid, studentData) {
  if (!parentUid) throw new Error('Parent UID is required to link transport.');
  const now = Date.now();
  const recordId = `ps_${parentUid}`;
  
  const payload = {
    id: recordId,
    parentUid,
    parentName: studentData.parentName || '',
    parentEmail: studentData.parentEmail || '',
    phone: studentData.phone || '',
    studentName: studentData.studentName || '',
    studentRelationship: studentData.studentRelationship || 'Parent',
    instituteId: studentData.instituteId || 'INST-AU',
    instituteName: studentData.instituteName || 'Andhra University',
    routeId: studentData.routeId || '',
    routeName: studentData.routeName || '',
    busId: studentData.busId || '',
    busNumber: studentData.busNumber || '',
    stopName: studentData.stopName || '',
    active: true,
    updatedAt: now,
    createdAt: now
  };

  // 1. Save to parentStudents collection
  await setDoc(doc(db, 'parentStudents', recordId), payload, { merge: true });
  
  // 2. Save to parents collection
  await setDoc(doc(db, 'parents', parentUid), payload, { merge: true });

  // 3. Save to students collection for backwards compatibility
  await setDoc(doc(db, 'students', recordId), {
    id: recordId,
    name: payload.studentName,
    fullName: payload.studentName,
    studentName: payload.studentName,
    parentId: parentUid,
    parentUid,
    parentName: payload.parentName,
    parentEmail: payload.parentEmail,
    phone: payload.phone,
    institutionId: payload.instituteId,
    instituteId: payload.instituteId,
    institutionName: payload.instituteName,
    routeId: payload.routeId,
    routeName: payload.routeName,
    busId: payload.busId,
    busNumber: payload.busNumber,
    stopName: payload.stopName,
    active: true,
    updatedAt: now,
    createdAt: now
  }, { merge: true });

  // 4. Update central users/{uid} document
  await saveUserProfile(parentUid, {
    role: 'parent',
    status: 'active',
    hasStudentLinked: true,
    needsStudentLink: false,
    instituteId: payload.instituteId,
    instituteName: payload.instituteName,
    routeId: payload.routeId,
    routeName: payload.routeName,
    busId: payload.busId,
    busNumber: payload.busNumber,
    stopName: payload.stopName,
    studentName: payload.studentName
  });

  return payload;
}

export async function getParentStudentTransport(parentUid) {
  if (!parentUid) return null;
  try {
    const recordId = `ps_${parentUid}`;
    const snap = await getDoc(doc(db, 'parentStudents', recordId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    const pSnap = await getDoc(doc(db, 'parents', parentUid));
    if (pSnap.exists()) {
      return { id: pSnap.id, ...pSnap.data() };
    }
  } catch (e) {
    console.warn('getParentStudentTransport note:', e);
  }
  return null;
}

export function subscribeParentStudentTransport(parentUid, callback) {
  if (!parentUid) {
    callback(null);
    return () => {};
  }
  const recordId = `ps_${parentUid}`;
  return onSnapshot(
    doc(db, 'parentStudents', recordId),
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        getDoc(doc(db, 'parents', parentUid)).then(pSnap => {
          if (pSnap.exists()) {
            callback({ id: pSnap.id, ...pSnap.data() });
          } else {
            callback(null);
          }
        }).catch(() => callback(null));
      }
    },
    (err) => {
      console.warn('subscribeParentStudentTransport error:', err);
      callback(null);
    }
  );
}

// ---------------------------------------------------------------------------
// 4. FLEET / BUS MANAGEMENT
// ---------------------------------------------------------------------------

const LOCAL_BUSES_KEY = 'nishchit_local_buses';

function getLocalBuses() {
  try {
    const raw = localStorage.getItem(LOCAL_BUSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBus(bus) {
  try {
    const current = getLocalBuses();
    const idx = current.findIndex(b => (b.id || b.busId) === (bus.id || bus.busId));
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...bus, updatedAt: Date.now() };
    } else {
      current.push(bus);
    }
    localStorage.setItem(LOCAL_BUSES_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('nishchit_buses_updated', { detail: current }));
  } catch (e) {
    console.warn('saveLocalBus note:', e);
  }
}

function deleteLocalBus(busId) {
  try {
    const current = getLocalBuses().filter(b => (b.id || b.busId) !== busId);
    localStorage.setItem(LOCAL_BUSES_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('nishchit_buses_updated', { detail: current }));
  } catch (e) {
    console.warn('deleteLocalBus note:', e);
  }
}

export function subscribeBuses(callback, institutionId = null) {
  const colRef = collection(db, 'buses');

  const emitMerged = (remoteBuses = []) => {
    const local = getLocalBuses();
    const map = new Map();
    // Pre-populate with region defaults if everything is empty
    if (remoteBuses.length === 0 && local.length === 0) {
      (INITIAL_VEHICLES || []).forEach(v => map.set(v.id || v.busId, v));
    }
    remoteBuses.forEach(b => map.set(b.id || b.busId, b));
    local.forEach(b => map.set(b.id || b.busId, { ...(map.get(b.id || b.busId) || {}), ...b }));
    let list = Array.from(map.values());
    if (institutionId) {
      list = list.filter(b => b.institutionId === institutionId || b.instituteId === institutionId);
    }
    callback(list);
  };

  const handleLocalUpdate = () => {
    emitMerged();
  };
  window.addEventListener('nishchit_buses_updated', handleLocalUpdate);

  const unsub = onSnapshot(
    colRef,
    (snap) => {
      const buses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emitMerged(buses);
    },
    (err) => {
      console.warn('subscribeBuses note (using local cache):', err);
      emitMerged([]);
    }
  );

  return () => {
    unsub();
    window.removeEventListener('nishchit_buses_updated', handleLocalUpdate);
  };
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
      console.warn('subscribeSingleBus note:', err);
      const local = getLocalBuses().find(b => (b.id || b.busId) === busId);
      callback(local || null);
    }
  );
}

export async function createBus(busData) {
  const busId = busData.busId || busData.id || `BUS-${Date.now().toString().slice(-4)}`;
  const now = Date.now();
  const institutionId = busData.institutionId || busData.instituteId || 'INST-AU';
  const payload = {
    id: busId,
    busId,
    busNumber: busData.busNumber || 'Bus New',
    registrationNumber: busData.registrationNumber || 'AP 31 AU 0000',
    capacity: Number(busData.capacity) || 52,
    status: busData.status || 'AVAILABLE',
    driverId: busData.driverId || null,
    driverName: busData.driverName || null,
    driverPhone: busData.driverPhone || null,
    routeId: busData.routeId || null,
    routeName: busData.routeName || null,
    institutionId,
    instituteId: institutionId,
    institutionName: busData.institutionName || 'Andhra University',
    createdAt: now,
    updatedAt: now
  };

  // Immediate local availability guarantee
  saveLocalBus(payload);

  try {
    await setDoc(doc(db, 'buses', busId), payload);
  } catch (err) {
    console.warn('createBus cloud note (cached locally):', err);
  }
  return payload;
}

export async function updateBus(busId, updates) {
  if (!busId) return;
  saveLocalBus({ id: busId, busId, ...updates });
  try {
    await setDoc(doc(db, 'buses', busId), {
      ...updates,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn('updateBus cloud note (cached locally):', err);
  }
}

export async function deleteBus(busId) {
  if (!busId) return;
  deleteLocalBus(busId);
  try {
    await deleteDoc(doc(db, 'buses', busId));
  } catch (err) {
    console.warn('deleteBus cloud note:', err);
  }
}

// ---------------------------------------------------------------------------
// 5. ROUTE MANAGEMENT
// ---------------------------------------------------------------------------

export function subscribeRoutes(callback, institutionId = null) {
  const colRef = collection(db, 'routes');
  return onSnapshot(
    colRef,
    (snap) => {
      let routes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (routes.length === 0) {
        routes = INITIAL_ROUTES;
      }
      if (institutionId) {
        routes = routes.filter(r => r.institutionId === institutionId || r.instituteId === institutionId);
      }
      callback(routes);
    },
    (err) => {
      console.warn('subscribeRoutes error:', err);
      let routes = INITIAL_ROUTES;
      if (institutionId) {
        routes = routes.filter(r => r.institutionId === institutionId || r.instituteId === institutionId);
      }
      callback(routes);
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
  const institutionId = routeData.institutionId || routeData.instituteId || 'INST-AU';
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
    institutionId,
    instituteId: institutionId,
    institutionName: routeData.institutionName || 'Andhra University',
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

  const institutionId = driverInfo.institutionId || driverInfo.instituteId || 'INST-AU';
  const tripPayload = {
    tripId,
    id: tripId,
    institutionId,
    instituteId: institutionId,
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
  try {
    await setDoc(doc(db, 'trips', tripId), tripPayload);
  } catch (err) {
    console.warn('startDriverTrip firestore trip note:', err);
  }

  // 2. Update Firestore bus
  const busUpdates = {
    id: busId,
    busId,
    status: 'ON_TRIP',
    activeTripId: tripId,
    institutionId,
    instituteId: institutionId,
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
  
  // Persist locally immediately
  saveLocalBus(busUpdates);

  try {
    await setDoc(doc(db, 'buses', busId), busUpdates, { merge: true });
  } catch (err) {
    console.warn('startDriverTrip firestore bus note (cached locally):', err);
  }

  // 3. Publish to Realtime Database
  const rtdbPayload = {
    tripId,
    busId,
    institutionId,
    instituteId: institutionId,
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
    await rtdbSet(rtdbRef(rtdb, `liveTrips/${tripId}`), rtdbPayload);
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
    await rtdbSet(rtdbRef(rtdb, `busLocations/${busId}`), updatePayload);
    await rtdbSet(rtdbRef(rtdb, `liveTrips/${busId}`), updatePayload);
    if (tripId && tripId !== busId) {
      await rtdbSet(rtdbRef(rtdb, `liveLocations/${tripId}`), updatePayload);
      await rtdbSet(rtdbRef(rtdb, `liveTrips/${tripId}`), updatePayload);
    }

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
      await setDoc(doc(db, 'buses', busId), {
        status: 'COMPLETED',
        activeTripId: null,
        updatedAt: now
      }, { merge: true });
    } catch (e) {
      console.warn('Bus status note:', e);
    }

    try {
      await rtdbUpdate(rtdbRef(rtdb, `liveLocations/${busId}`), { active: false, endedAt: now });
      await rtdbUpdate(rtdbRef(rtdb, `busLocations/${busId}`), { active: false, endedAt: now });
      await rtdbUpdate(rtdbRef(rtdb, `liveTrips/${busId}`), { active: false, endedAt: now });
      if (tripId && tripId !== busId) {
        await rtdbUpdate(rtdbRef(rtdb, `liveLocations/${tripId}`), { active: false, endedAt: now });
        await rtdbUpdate(rtdbRef(rtdb, `liveTrips/${tripId}`), { active: false, endedAt: now });
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

  const tripRef = rtdbRef(rtdb, `liveTrips/${tripIdOrBusId}`);
  const unsubTrip = rtdbOnValue(
    tripRef,
    (snap) => {
      if (snap.exists() && snap.val()?.active) {
        callback(snap.val());
      } else {
        const locRef = rtdbRef(rtdb, `liveLocations/${tripIdOrBusId}`);
        rtdbGet(locRef).then((lSnap) => {
          if (lSnap.exists() && lSnap.val()?.active) {
            callback(lSnap.val());
          } else {
            const busRef = rtdbRef(rtdb, `busLocations/${tripIdOrBusId}`);
            rtdbGet(busRef).then((bSnap) => {
              callback(bSnap.exists() ? bSnap.val() : null);
            }).catch(() => callback(null));
          }
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

export const subscribeLiveTripLocation = subscribeLiveLocation;

export function subscribeActiveTripByBus(busId, callback) {
  if (!busId) {
    callback(null);
    return () => {};
  }
  const q = query(
    collection(db, 'trips'),
    where('busId', '==', busId),
    where('status', '==', 'ACTIVE')
  );
  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        callback({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn('subscribeActiveTripByBus error:', err);
      callback(null);
    }
  );
}

export function subscribeActiveTrips(callback, institutionId = null) {
  const q = query(collection(db, 'trips'), where('status', '==', 'ACTIVE'));
  return onSnapshot(
    q,
    (snap) => {
      let trips = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (institutionId) {
        trips = trips.filter(t => t.institutionId === institutionId || t.instituteId === institutionId);
      }
      callback(trips);
    },
    (err) => {
      console.warn('subscribeActiveTrips error:', err);
      callback([]);
    }
  );
}

export function subscribeTripHistory(callback, institutionId = null) {
  const q = query(collection(db, 'tripHistory'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (institutionId) {
        list = list.filter(t => t.institutionId === institutionId || t.instituteId === institutionId);
      }
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

const LOCAL_REPORTS_KEY = 'nishchit_local_reports';

function getLocalReports() {
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReport(report) {
  try {
    const current = getLocalReports();
    current.unshift(report);
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(current.slice(0, 50)));
    window.dispatchEvent(new CustomEvent('nishchit_reports_updated', { detail: current }));
  } catch (e) {
    console.warn('saveLocalReport note:', e);
  }
}

export function subscribeIncidentReports(callback, institutionId = null) {
  const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(50));

  const emitMerged = (remote = []) => {
    const local = getLocalReports();
    const map = new Map();
    remote.forEach(r => map.set(r.id || r.reportId, r));
    local.forEach(r => map.set(r.id || r.reportId, { ...(map.get(r.id || r.reportId) || {}), ...r }));
    let merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (institutionId) {
      merged = merged.filter(r => r.institutionId === institutionId || r.instituteId === institutionId);
    }
    callback(merged);
  };

  const handleLocalUpdate = () => {
    emitMerged();
  };
  window.addEventListener('nishchit_reports_updated', handleLocalUpdate);

  const unsub = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emitMerged(list);
    },
    (err) => {
      console.warn('subscribeIncidentReports note (using local cache):', err);
      emitMerged([]);
    }
  );

  return () => {
    unsub();
    window.removeEventListener('nishchit_reports_updated', handleLocalUpdate);
  };
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

  // Immediate local cache
  saveLocalReport(payload);

  try {
    await setDoc(doc(db, 'reports', reportId), payload);
  } catch (err) {
    console.warn('submitIncidentReport cloud note (saved locally):', err);
  }
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

export function subscribeSchedules(callback, institutionId = null) {
  const colRef = collection(db, 'schedules');
  return onSnapshot(
    colRef,
    (snap) => {
      let schedules = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      schedules.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      if (institutionId) {
        schedules = schedules.filter(s => s.institutionId === institutionId || s.instituteId === institutionId);
      }
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
  const institutionId = scheduleData.institutionId || scheduleData.instituteId || 'INST-AU';
  const payload = {
    id: scheduleId,
    scheduleId,
    institutionId,
    instituteId: institutionId,
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
