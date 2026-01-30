export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  province?: string;
}

export const requestLocationPermission = async (): Promise<UserLocation | null> => {
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get city/province
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          
          resolve({
            latitude,
            longitude,
            city: data.address?.city || data.address?.town || data.address?.village,
            province: data.address?.state
          });
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          resolve({ latitude, longitude });
        }
      },
      (error) => {
        console.error('Location permission denied:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Calculate distance between two points in km
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
