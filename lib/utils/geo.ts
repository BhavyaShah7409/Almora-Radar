import { Coordinates } from '@/types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers

  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);
  const deltaLat = toRadians(coord2.lat - coord1.lat);
  const deltaLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a point is within a geofence radius
 */
export function isWithinGeofence(
  point: Coordinates,
  center: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(point, center);
  return distance <= radiusKm;
}

/**
 * Get bounding box for a given center point and radius
 */
export function getBoundingBox(
  center: Coordinates,
  radiusKm: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latDelta = (radiusKm / 111.32); // 1 degree latitude ≈ 111.32 km
  const lngDelta = radiusKm / (111.32 * Math.cos(toRadians(center.lat)));

  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta,
  };
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`;
}
