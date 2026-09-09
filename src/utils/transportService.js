/**
 * Nishchit Transport Service Re-export
 * Bridges all historical transport utilities to the authoritative Firestore + RTDB service.
 */

export * from '../services/transportService';
export {
  subscribeBuses as subscribeFleet,
  ensureInitialCorridorData as seedTransportDatabase
} from '../services/transportService';
