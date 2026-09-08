import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebase';

const CHANNEL_NAME = 'nishchit_bus_sync';
const busChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

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
  lastUpdated: Date.now(),
  startedAt: null,
  endedAt: null,
  isDemoMode: false
};

// Local storage helper
export function getStoredBusState(busId = 'BUS24') {
  try {
    const raw = localStorage.getItem(`nishchit_bus_${busId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }
  return DEFAULT_BUS_STATE;
}

export function saveStoredBusState(busId = 'BUS24', state) {
  try {
    localStorage.setItem(`nishchit_bus_${busId}`, JSON.stringify(state));
  } catch (e) {
    // Ignore
  }
}

// Update Bus State (Driver Side)
export async function updateBusState(busId = 'BUS24', patchObj) {
  const currentState = getStoredBusState(busId);
  const newState = {
    ...currentState,
    ...patchObj,
    lastUpdated: patchObj.lastUpdated || Date.now()
  };

  saveStoredBusState(busId, newState);

  // Broadcast to other tabs locally
  if (busChannel) {
    busChannel.postMessage({ type: 'BUS_UPDATE', busId, data: newState });
  }

  // Update Firebase Realtime Database
  try {
    await update(ref(database, `buses/${busId}`), newState);
  } catch (err) {
    console.warn("Firebase update warning (using local sync fallback):", err);
  }

  return newState;
}

// Subscribe to Bus State (Parent & Driver Viewers)
export function subscribeBusState(busId = 'BUS24', callback) {
  // 1. Send immediate cached local state
  const initialLocal = getStoredBusState(busId);
  callback(initialLocal);

  // 2. Firebase Realtime Listener
  let fbUnsubscribe = () => {};
  try {
    const busRef = ref(database, `buses/${busId}`);
    fbUnsubscribe = onValue(busRef, (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.val();
        const merged = { ...getStoredBusState(busId), ...remoteData };
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
      } catch (e) {}
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
