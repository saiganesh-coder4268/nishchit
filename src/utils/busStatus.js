/**
 * Authoritative Bus Status & Location Freshness Utility for Nishchit.
 * 
 * Centralizes thresholds and status calculation so Driver and Parent views
 * present consistent, trustworthy operational states.
 */

// Freshness thresholds in milliseconds
export const FRESHNESS_LIVE_MS = 60 * 1000;        // <= 60s is LIVE
export const FRESHNESS_STALE_MS = 5 * 60 * 1000;   // > 60s and <= 5 min is STALE

/**
 * Validate latitude & longitude numeric bounds.
 */
export function isValidCoordinate(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng)) return false;
  if (nLat === 0 && nLng === 0) return false;
  if (nLat < -90 || nLat > 90) return false;
  if (nLng < -180 || nLng > 180) return false;
  return true;
}

/**
 * Calculate bus location freshness state.
 * 
 * @param {Object} busData - The bus state object
 * @param {number} now - Current timestamp in ms
 * @returns {'LIVE' | 'STALE' | 'UNAVAILABLE' | 'NOT_STARTED' | 'COMPLETED'}
 */
export function calculateLocationFreshness(busData, now = Date.now()) {
  if (!busData) return 'UNAVAILABLE';
  const status = busData.status || 'NOT_STARTED';

  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'NOT_STARTED') return 'NOT_STARTED';

  if (status === 'LIVE') {
    const hasValidCoords = isValidCoordinate(busData.latitude, busData.longitude);
    if (!hasValidCoords) return 'UNAVAILABLE';

    const lastUpdated = Number(busData.lastUpdated) || 0;
    if (!lastUpdated) return 'UNAVAILABLE';

    const diffMs = Math.max(0, now - lastUpdated);

    if (diffMs <= FRESHNESS_LIVE_MS) {
      return 'LIVE';
    } else if (diffMs <= FRESHNESS_STALE_MS) {
      return 'STALE';
    } else {
      return 'UNAVAILABLE';
    }
  }

  return 'UNAVAILABLE';
}

/**
 * Get human-readable parent-facing status summary.
 * 
 * @param {Object} busData 
 * @param {number} now 
 * @returns {{ title: string, subtitle: string, status: string }}
 */
export function getParentStatusInfo(busData, now = Date.now()) {
  const freshness = calculateLocationFreshness(busData, now);
  const lastUpdated = Number(busData?.lastUpdated) || 0;

  const formatRelativeTime = (ts) => {
    if (!ts) return 'recently';
    const diffSec = Math.floor(Math.max(0, now - ts) / 1000);
    if (diffSec < 10) return '8 seconds ago';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return '1 minute ago';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours} hours ago`;
  };

  switch (freshness) {
    case 'LIVE':
      return {
        status: 'LIVE',
        title: 'BUS IS LIVE',
        subtitle: `Bus is moving — Last updated ${formatRelativeTime(lastUpdated)}`
      };

    case 'STALE':
      return {
        status: 'STALE',
        title: 'LOCATION MAY BE OUTDATED',
        subtitle: `Location hasn't updated recently — Last received ${formatRelativeTime(lastUpdated)}. Coordinates may not reflect exact live position.`
      };

    case 'UNAVAILABLE':
      if (busData?.status === 'LIVE') {
        return {
          status: 'STALE',
          title: 'LOCATION UNAVAILABLE',
          subtitle: `Location stream interrupted — Last update received ${formatRelativeTime(lastUpdated)}.`
        };
      }
      return {
        status: 'NOT_STARTED',
        title: 'LOCATION UNAVAILABLE',
        subtitle: 'No valid location coordinates received for this bus.'
      };

    case 'COMPLETED':
      return {
        status: 'COMPLETED',
        title: 'TRIP COMPLETED',
        subtitle: "Today's bus trip has ended safely."
      };

    case 'NOT_STARTED':
    default:
      return {
        status: 'NOT_STARTED',
        title: 'BUS NOT STARTED',
        subtitle: "Your bus hasn't started its trip yet."
      };
  }
}

/**
 * Driver-facing operational tracking status.
 * 
 * @param {Object} busData 
 * @param {boolean} isStarting 
 * @param {string|null} gpsError 
 * @param {number} now 
 * @returns {{ trackingState: string, label: string, subtext: string }}
 */
export function getDriverTrackingStatus(busData, isStarting, gpsError, now = Date.now()) {
  if (gpsError) {
    return {
      trackingState: 'GPS_ERROR',
      label: 'LOCATION UNAVAILABLE',
      subtext: gpsError
    };
  }

  if (isStarting) {
    return {
      trackingState: 'STARTING',
      label: 'STARTING TRIP...',
      subtext: 'Acquiring GPS location fix and connecting...'
    };
  }

  const status = busData?.status || 'NOT_STARTED';

  if (status === 'COMPLETED') {
    return {
      trackingState: 'COMPLETED',
      label: 'TRIP COMPLETED',
      subtext: 'Trip ended safely'
    };
  }

  if (status === 'LIVE') {
    const freshness = calculateLocationFreshness(busData, now);
    if (freshness === 'STALE' || freshness === 'UNAVAILABLE') {
      return {
        trackingState: 'CONNECTION_DEGRADED',
        label: 'CONNECTION UNSTABLE',
        subtext: 'Retrying location update...'
      };
    }
    return {
      trackingState: 'LIVE',
      label: 'LOCATION SHARING ACTIVE',
      subtext: 'GPS tracking active'
    };
  }

  return {
    trackingState: 'READY',
    label: 'BUS READY',
    subtext: 'Trip ready to depart'
  };
}
