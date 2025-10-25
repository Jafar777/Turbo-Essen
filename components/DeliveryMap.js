// components/DeliveryMap.js (simplified version)
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

export default function DeliveryMap({ onLocationSelect, initialLocation }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [floor, setFloor] = useState('');
  const [instructions, setInstructions] = useState('');
  const { isLoaded, error: mapsError } = useGoogleMaps();

  const initializeMap = useCallback(() => {
    if (!isLoaded || !mapRef.current) {
      return;
    }

    try {
      const defaultLocation = initialLocation || { lat: 40.7128, lng: -74.0060 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: 15,
      });

      const marker = new window.google.maps.Marker({
        position: defaultLocation,
        map: map,
        draggable: true,
        title: 'Drag to set delivery location'
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Add click listener to map
      map.addListener('click', (e) => {
        const location = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        };
        updateMarkerPosition(location);
        getAddressFromCoordinates(location);
      });

      // Add drag end listener to marker
      marker.addListener('dragend', () => {
        const location = {
          lat: marker.getPosition().lat(),
          lng: marker.getPosition().lng()
        };
        getAddressFromCoordinates(location);
      });

      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            map.setCenter(userLocation);
            updateMarkerPosition(userLocation);
            getAddressFromCoordinates(userLocation);
          },
          () => {
            getAddressFromCoordinates(defaultLocation);
          }
        );
      } else {
        getAddressFromCoordinates(defaultLocation);
      }

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [isLoaded, initialLocation]);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isLoaded) {
      // Small timeout to ensure DOM is ready
      const timer = setTimeout(initializeMap, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, initializeMap]);

  const updateMarkerPosition = (location) => {
    if (markerRef.current) {
      markerRef.current.setPosition(location);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(location);
    }
  };

  const getAddressFromCoordinates = async (location) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          setAddress(address);
          
          if (onLocationSelect) {
            onLocationSelect({
              address,
              coordinates: location,
              apartment,
              floor,
              instructions
            });
          }
        }
      });
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  const handleFormChange = () => {
    if (markerRef.current && onLocationSelect) {
      const location = markerRef.current.getPosition();
      onLocationSelect({
        address,
        coordinates: {
          lat: location.lat(),
          lng: location.lng()
        },
        apartment,
        floor,
        instructions
      });
    }
  };

  if (mapsError) {
    return (
      <div className="w-full h-64 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading map: {mapsError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📍 Set Delivery Location</h3>
        <p className="text-blue-700 text-sm">
          Click on the map or drag the marker to set your exact delivery location.
          You can also use your current location (automatically detected if available).
        </p>
      </div>

      <div 
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-gray-300 bg-gray-100"
        style={{ minHeight: '256px' }}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Address
        </label>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-800">{address || 'Click on the map to set location'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apartment/Unit
          </label>
          <input
            type="text"
            value={apartment}
            onChange={(e) => {
              setApartment(e.target.value);
              handleFormChange();
            }}
            placeholder="e.g., Apt 4B"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Floor
          </label>
          <input
            type="text"
            value={floor}
            onChange={(e) => {
              setFloor(e.target.value);
              handleFormChange();
            }}
            placeholder="e.g., 3rd floor"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Instructions (Optional)
        </label>
        <textarea
          value={instructions}
          onChange={(e) => {
            setInstructions(e.target.value);
            handleFormChange();
          }}
          rows="3"
          placeholder="e.g., Ring doorbell, leave at door, call when arrived..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}