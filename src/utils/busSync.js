import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebase';

const CHANNEL_NAME = 'nishchit_bus_sync';
const busChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
const MIN_WRITE_INTERVAL_MS = 1500; // Throttle RTDB updates to max 1 per 1.5 seconds unless status/mode changes
const lastWriteTimeMap = {};

// Initial default bus state
const DEFAULT_BUS_STATE = {
  busNumber: 'Bus 24',
  routeNumber: 'Route 04',
  driverId: 'DRV001',
  driverName: 'Rajesh Kumar',
  status: 'NOT_STARTED',
  latitude: 17.4399,
  longitude: 78.4983,
  accuracy: 10,
  lastUpdated: null,
  startedAt: null,
  endedAt: null,
  isDemoMode: false
};

// Validate latitude & longitude bounds
export function isValidCoordinate(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng)) return false;
  if (nLat === 0 && nLng === 0) return false;
  if (nLat < -90 || nLat > 90) return false;
  if (nLng < -180 || nLng > 180) return false;
  return true;
}

// Local storage helper
export function getStoredBusState(busId = 'BUS24') {
  try {
    const raw = localStorage.getItem(`nishchit_bus_${busId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return DEFAULT_BUS_STATE;
}

export function saveStoredBusState(busId = 'BUS24', state) {
  try {
    localStorage.setItem(`nishchit_bus_${busId}`, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

// Update Bus State (Driver Side)
export async function updateBusState(busId = 'BUS24', patchObj) {
  const currentState = getStoredBusState(busId);
  const now = Date.now();

  // Validate coordinates if supplied in patch
  const cleanPatch = { ...patchObj };
  const hasNewCoords = cleanPatch.latitude !== undefined || cleanPatch.longitude !== undefined;
  if (hasNewCoords) {
    const checkLat = cleanPatch.latitude !== undefined ? cleanPatch.latitude : currentState.latitude;
    const checkLng = cleanPatch.longitude !== undefined ? cleanPatch.longitude : currentState.longitude;
    if (!isValidCoordinate(checkLat, checkLng)) {
      console.warn("Invalid coordinates rejected in updateBusState:", cleanPatch.latitude, cleanPatch.longitude);
      delete cleanPatch.latitude;
      delete cleanPatch.longitude;
    }
  }

  // Preserve existing timestamp unless explicit timestamp passed or new position coordinates supplied
  let targetLastUpdated = currentState.lastUpdated;
  if (cleanPatch.lastUpdated !== undefined) {
    targetLastUpdated = cleanPatch.lastUpdated;
  } else if (hasNewCoords || cleanPatch.status === 'LIVE' || cleanPatch.status === 'COMPLETED') {
    targetLastUpdated = now;
  }

  const newState = {
    ...currentState,
    ...cleanPatch,
    lastUpdated: targetLastUpdated
  };

  saveStoredBusState(busId, newState);

  // Broadcast to other tabs locally
  if (busChannel) {
    try {
      busChannel.postMessage({ type: 'BUS_UPDATE', busId, data: newState });
    } catch (e) {
      console.warn("BroadcastChannel postMessage warning:", e);
    }
  }

  // Throttle Firebase Realtime Database writes to prevent excessive network spam
  const lastWriteTime = lastWriteTimeMap[busId] || 0;
  const isStatusChange = cleanPatch.status && cleanPatch.status !== currentState.status;
  const isModeChange = cleanPatch.isDemoMode !== undefined && cleanPatch.isDemoMode !== currentState.isDemoMode;

  if (!isStatusChange && !isModeChange && (now - lastWriteTime < MIN_WRITE_INTERVAL_MS)) {
    return newState;
  }

  lastWriteTimeMap[busId] = now;

  // Asynchronously sync to Firebase Realtime Database (non-blocking for UI responsiveness)
  update(ref(database, `buses/${busId}`), newState).catch((err) => {
    console.warn("Firebase realtime sync write fallback:", err);
  });

  return newState;
}

// Subscribe to Bus State (Parent & Driver Viewers)
export function subscribeBusState(busId = 'BUS24', callback) {
  // 1. Send immediate cached local state (tagged as cached)
  const initialLocal = getStoredBusState(busId);
  callback({ ...initialLocal, isCached: true });

  // 2. Firebase Realtime Listener
  let fbUnsubscribe = () => {};
  try {
    const busRef = ref(database, `buses/${busId}`);
    fbUnsubscribe = onValue(busRef, (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.val();
        // Validate coordinates from remote data
        if (remoteData.latitude !== undefined && remoteData.longitude !== undefined) {
          if (!isValidCoordinate(remoteData.latitude, remoteData.longitude)) {
            delete remoteData.latitude;
            delete remoteData.longitude;
          }
        }
        const merged = { ...getStoredBusState(busId), ...remoteData, isCached: false };
        saveStoredBusState(busId, merged);
        callback(merged);
      }
    }, (err) => {
      console.warn("Firebase listener warning (using local sync fallback):", err);
    });
  } catch (e) {
    console.warn("Firebase database reference error:", e);
  }

  // 3. BroadcastChannel Listener
  const handleBroadcast = (event) => {
    if (event.data && event.data.type === 'BUS_UPDATE' && event.data.busId === busId) {
      callback(event.data.data);
    }
  };

  if (busChannel) {
    busChannel.addEventListener('message', handleBroadcast);
  }

  // 4. Window Storage Event Listener
  const handleStorage = (event) => {
    if (event.key === `nishchit_bus_${busId}` && event.newValue) {
      try {
        callback(JSON.parse(event.newValue));
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);

  // Unsubscribe function
  return () => {
    fbUnsubscribe();
    if (busChannel) {
      busChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}

