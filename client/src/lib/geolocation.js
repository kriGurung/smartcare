/**
 * Promise wrapper around navigator.geolocation.getCurrentPosition.
 * Resolves with { latitude, longitude } or rejects with a friendly Error.
 */
export function getCurrentPosition({ timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Location permission denied. Please enable location access in your browser settings.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('Location request timed out. Please try again.'));
        } else {
          reject(new Error('Unable to retrieve your location. Please try again.'));
        }
      },
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });
}
