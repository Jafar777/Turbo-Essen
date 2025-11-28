// components/DeliveryMap.js (updated version)
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
      });

      // Add drag end listener to marker
      marker.addListener('dragend', () => {
        const location = {
          lat: marker.getPosition().lat(),
          lng: marker.getPosition().lng()
        };
        // Only update coordinates, not address
        handleFormChange();
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
          },
          () => {
            // If geolocation fails, just center on default location
            updateMarkerPosition(defaultLocation);
          }
        );
      } else {
        updateMarkerPosition(defaultLocation);
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

  const handleFormChange = () => {
    if (markerRef.current && onLocationSelect) {
      const location = markerRef.current.getPosition();
      onLocationSelect({
        address, // Use the user-entered address
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

  // Handle address input change
  const handleAddressChange = (e) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    // Trigger form change with new address
    setTimeout(handleFormChange, 0);
  };

  // Handle other field changes
  const handleFieldChange = (field, value) => {
    switch (field) {
      case 'apartment':
        setApartment(value);
        break;
      case 'floor':
        setFloor(value);
        break;
      case 'instructions':
        setInstructions(value);
        break;
    }
    setTimeout(handleFormChange, 0);
  };

  if (mapsError) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📍 Delivery Information</h3>
          <p className="text-blue-700 text-sm">
            Please provide your delivery address and instructions below.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Address *
          </label>
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter your full delivery address"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Please provide your complete delivery address
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apartment/Unit
            </label>
            <input
              type="text"
              value={apartment}
              onChange={(e) => handleFieldChange('apartment', e.target.value)}
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
              onChange={(e) => handleFieldChange('floor', e.target.value)}
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
            onChange={(e) => handleFieldChange('instructions', e.target.value)}
            rows="3"
            placeholder="e.g., Ring doorbell, leave at door, call when arrived..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📍 Delivery Information</h3>
          <p className="text-blue-700 text-sm">
            Please provide your delivery address and instructions below.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Address *
          </label>
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter your full delivery address"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading map...</p>
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
              onChange={(e) => handleFieldChange('apartment', e.target.value)}
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
              onChange={(e) => handleFieldChange('floor', e.target.value)}
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
            onChange={(e) => handleFieldChange('instructions', e.target.value)}
            rows="3"
            placeholder="e.g., Ring doorbell, leave at door, call when arrived..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📍 Delivery Information</h3>
        <p className="text-blue-700 text-sm">
          Please provide your delivery address below. The map is optional and can be used to help the driver locate your building.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Address *
        </label>
        <input
          type="text"
          value={address}
          onChange={handleAddressChange}
          placeholder="Enter your full delivery address (street, city, zip code)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Please provide your complete delivery address including street number, street name, city, and zip code
        </p>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h4 className="font-semibold text-amber-900 mb-2">🗺️ Optional: Set Building Location on Map</h4>
        <p className="text-amber-700 text-sm">
          You can click on the map to mark your building location. This helps the driver but is not required.
        </p>
      </div>

      <div 
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-gray-300 bg-gray-100"
        style={{ minHeight: '256px' }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apartment/Unit
          </label>
          <input
            type="text"
            value={apartment}
            onChange={(e) => handleFieldChange('apartment', e.target.value)}
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
            onChange={(e) => handleFieldChange('floor', e.target.value)}
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
          onChange={(e) => handleFieldChange('instructions', e.target.value)}
          rows="3"
          placeholder="e.g., Ring doorbell, leave at door, call when arrived..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}