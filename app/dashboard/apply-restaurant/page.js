// app/dashboard/apply-restaurant/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { showToast } from '@/lib/toast';

export default function ApplyRestaurantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    phone: '',
    cuisineType: '',
    description: '',
    location: { lat: 52.5200, lng: 13.4050 } // Berlin, Germany coordinates
  });
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 52.5200, lng: 13.4050 });

  // Redirect if user is not logged in or doesn't have 'user' role
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (session.user.role !== 'user') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMapClick = (event) => {
    const lat = event.detail.latLng.lat;
    const lng = event.detail.latLng.lng;
    
    setSelectedLocation({ lat, lng });
    setFormData(prev => ({
      ...prev,
      location: { lat, lng }
    }));
  };

  const handleAddressSearch = async () => {
    if (!formData.address) return;
    
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(formData.address)}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setSelectedLocation(location);
        setFormData(prev => ({
          ...prev,
          location
        }));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Could not find the address. Please try again or select location directly on the map.');
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const submissionData = {
      ...formData,
      coordinates: selectedLocation
    };

    const response = await fetch('/api/restaurants/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    });

    const result = await response.json();

    if (response.ok) {
    showToast.success('Application submitted successfully! We will review your request.');
      // Reset form to Germany coordinates
      setFormData({
        restaurantName: '',
        address: '',
        phone: '',
        cuisineType: '',
        description: '',
        location: { lat: 52.5200, lng: 13.4050 }
      });
      setSelectedLocation({ lat: 52.5200, lng: 13.4050 });
    } else {
    showToast.error(result.error || 'Failed to submit application. Please try again.');
    }
  } catch (error) {
    console.error('Error submitting application:', error);
    alert('Error submitting application. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Map Component with Click Handler
  const RestaurantMap = () => (
    <Map
      style={{ width: '100%', height: '400px' }}
      defaultCenter={selectedLocation}
      defaultZoom={10} // Slightly lower zoom for city view
      gestureHandling={'greedy'}
      disableDefaultUI={false}
      onClick={handleMapClick}
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID} // Make sure this is defined
    >
      <AdvancedMarker position={selectedLocation} />
    </Map>
  );

  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'user') {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with Restaurant Theme */}
      <div className="bg-gradient-to-r from-[#ce5a46] to-[#D22E26] rounded-t-2xl p-6 text-white mb-8">
        <h1 className="text-3xl font-bold">Apply as a Restaurant</h1>
        <p className="text-amber-100 mt-2">
          Fill out your restaurant details and pinpoint your exact location on the map
        </p>
      </div>

      <div className="bg-white rounded-b-2xl shadow-lg  border-amber-100 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-amber-100 pb-2">
                Restaurant Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-amber-50/30"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cuisineType" className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type *
                  </label>
                  <input
                    type="text"
                    id="cuisineType"
                    name="cuisineType"
                    value={formData.cuisineType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-amber-50/30"
                    placeholder="e.g., Italian, Chinese, Mexican"
                    required
                  />
                </div>
              </div>

              {/* Address Search Section */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Address *
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-amber-50/30"
                      placeholder="Enter your restaurant address to search on map..."
                      required
                    />
                    <button
                      type="button"
                      onClick={handleAddressSearch}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200 whitespace-nowrap"
                    >
                      Search on Map
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Enter your address above or click directly on the map to set your restaurant location
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-amber-50/30"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-amber-50/30"
                  placeholder="Tell us about your restaurant, your specialties, and why you'd like to join our platform..."
                  required
                />
              </div>
            </div>

            {/* Map Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-amber-100 pb-2">
                Set Your Exact Location
              </h3>
              <p className="text-sm text-gray-600">
                Click on the map to mark your restaurants precise location. Selected coordinates: 
                <span className="font-mono text-amber-600 ml-2">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </span>
              </p>
              
              <div className="border-2 border-amber-200 rounded-lg overflow-hidden">
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                  <RestaurantMap />
                </APIProvider>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-amber-100">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Application...
                  </span>
                ) : (
                  'Submit Application'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    restaurantName: '',
                    address: '',
                    phone: '',
                    cuisineType: '',
                    description: '',
                    location: { lat: 40.7128, lng: -74.0060 }
                  });
                  setSelectedLocation({ lat: 40.7128, lng: -74.0060 });
                }}
                className="flex-1 px-6 py-3 border border-amber-300 text-amber-700 hover:bg-amber-50 font-medium rounded-lg transition-colors duration-200"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}