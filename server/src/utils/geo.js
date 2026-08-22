/**
 * Great-circle distance between two lat/lng points using the Haversine formula.
 * Returns distance in metres, rounded to the nearest integer.
 */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's mean radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
