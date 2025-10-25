// hooks/useGoogleMaps.js
import { useEffect, useState } from 'react';

let googleMapsLoaded = false;
let googleMapsLoadingPromise = null;

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(googleMapsLoaded);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (googleMapsLoaded) {
      setIsLoaded(true);
      return;
    }

    if (googleMapsLoadingPromise) {
      googleMapsLoadingPromise.then(
        () => setIsLoaded(true),
        (err) => setError(err)
      );
      return;
    }

    googleMapsLoadingPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not defined'));
        return;
      }

      if (window.google && window.google.maps) {
        googleMapsLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        googleMapsLoaded = true;
        setIsLoaded(true);
        resolve();
      };
      
      script.onerror = () => {
        const error = new Error('Failed to load Google Maps');
        setError(error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }, []);

  return { isLoaded, error };
}