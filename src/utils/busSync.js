/**
 * Nishchit Realtime Synchronization Utility (Production Hardened)
 * Grounded in zero-mock enterprise architecture.
 * No dummy coordinates, no fallback fake drivers, strictly authentic state.
 */
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '../firebase';
import { isValidCoordinate } from './busStatus';

export { isValidCoordinate };

const CHANNEL_NAME = 'nishchit_bus_sync';
const busChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
const MIN_WRITE_INTERVAL_MS = 1500;
const lastWriteTimeMap = {};

// Local storage helper
export function getStoredBusState(busId) {
  if (!busId) return null;
  try {
    const raw = localStorage.getItem(`nishchit_bus_${busId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return null;
}

export function saveStoredBusState(busId, state) {
  if (!busId || !state) return;
  try {
    localStorage.setItem(`nishchit_bus_${busId}`, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

// Update Bus State (Driver Side)
export async function updateBusState(busId, patchObj) {
  if (!busId) return null;
  const currentState = getStoredBusState(busId) || {};
  const now = Date.now();

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

  let targetLastUpdated = currentState.lastUpdated;
  if (cleanPatch.lastUpdated !== undefined) {
    targetLastUpdated = cleanPatch.lastUpdated;
  } else if (hasNewCoords || cleanPatch.status === 'LIVE' || cleanPatch.status === 'COMPLETED') {
    targetLastUpdated = now;
  }

  const newState = {
    ...currentState,
    ...cleanPatch,
    busId,
    lastUpdated: targetLastUpdated
  };

  saveStoredBusState(busId, newState);

  if (busChannel) {
    try {
      busChannel.postMessage({ type: 'BUS_UPDATE', busId, data: newState });
    } catch (e) {
      console.warn("BroadcastChannel postMessage warning:", e);
    }
  }

  const lastWriteTime = lastWriteTimeMap[busId] || 0;
  const isStatusChange = cleanPatch.status && cleanPatch.status !== currentState.status;

  if (!isStatusChange && (now - lastWriteTime < MIN_WRITE_INTERVAL_MS)) {
    return newState;
  }

  lastWriteTimeMap[busId] = now;

  update(ref(rtdb, `liveLocations/${busId}`), newState).catch((err) => {
    console.warn("Firebase realtime sync write fallback:", err);
  });

  return newState;
}

// Subscribe to Bus State
export function subscribeBusState(busId, callback) {
  if (!busId) return () => {};

  const initialLocal = getStoredBusState(busId);
  if (initialLocal) {
    callback({ ...initialLocal, isCached: true });
  }

  let fbUnsubscribe = () => {};
  try {
    const busRef = ref(rtdb, `liveLocations/${busId}`);
    fbUnsubscribe = onValue(busRef, (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.val();
        if (remoteData.latitude !== undefined && remoteData.longitude !== undefined) {
          if (!isValidCoordinate(remoteData.latitude, remoteData.longitude)) {
            delete remoteData.latitude;
            delete remoteData.longitude;
          }
        }
        const merged = { ...(getStoredBusState(busId) || {}), ...remoteData, isCached: false };
        saveStoredBusState(busId, merged);
        callback(merged);
      }
    }, (err) => {
      console.warn("Firebase listener warning:", err);
    });
  } catch (e) {
    console.warn("Firebase database reference error:", e);
  }

  const handleBroadcast = (event) => {
    if (event.data && event.data.type === 'BUS_UPDATE' && event.data.busId === busId) {
      callback(event.data.data);
    }
  };

  if (busChannel) {
    busChannel.addEventListener('message', handleBroadcast);
  }

  const handleStorage = (event) => {
    if (event.key === `nishchit_bus_${busId}` && event.newValue) {
      try {
        callback(JSON.parse(event.newValue));
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    fbUnsubscribe();
    if (busChannel) {
      busChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}
