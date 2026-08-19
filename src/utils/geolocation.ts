// src/utils/geolocation.ts

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Conchalí Central Coordinate (Metro Dorsal)
export const FALLBACK_COORDINATES: Coordinates = {
  latitude: -33.3989,
  longitude: -70.6738,
};

/**
 * Requests the user's current GPS position.
 * Resolves with the browser coordinates or falls back to Conchalí coordinates.
 */
export const getBrowserLocation = (): Promise<Coordinates> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      resolve(FALLBACK_COORDINATES);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation request failed, using default coordinates.", error.message);
        resolve(FALLBACK_COORDINATES);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 1000 * 60 * 5, // Cache for 5 mins
      }
    );
  });
};

/**
 * Calculates the spherical distance in meters between two coordinates using the Haversine formula.
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Radius of the Earth in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
};

/**
 * Computes walking time in minutes based on distance.
 * Assumes average walking speed of 1.3 meters/second (~4.7 km/h).
 */
export const calculateWalkTime = (distanceMeters: number): number => {
  const speed = 1.3; // m/s
  const timeInSeconds = distanceMeters / speed;
  return Math.max(1, Math.round(timeInSeconds / 60)); // minimum 1 minute
};
