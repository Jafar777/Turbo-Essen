// components/LiveOrderTracker.js - UPDATED VERSION
'use client';
import { useEffect, useState, useRef } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

export default function LiveOrderTracker({ orderId, destination }) {
  const [deliveryPosition, setDeliveryPosition] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('waiting');
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const { isLoaded, error } = useGoogleMaps();
  
  useEffect(() => {
    if (!orderId || !isLoaded) return;
    
    setConnectionStatus('connecting');
    const eventSource = new EventSource(`/api/delivery/${orderId}/location`);

    eventSource.onopen = () => setConnectionStatus('connected');
    eventSource.onmessage = (event) => {
      try {
        const locationData = JSON.parse(event.data);
        setDeliveryPosition(locationData);
        updateMapMarker(locationData);
        setConnectionStatus('live'); // Update status when data arrives
      } catch (err) {
        console.error('Error parsing location data:', err);
        setConnectionStatus('error');
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      setConnectionStatus('disconnected');
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setConnectionStatus('disconnected');
    };
  }, [orderId, isLoaded]);

  const updateMapMarker = (pos) => {
    if (!mapRef.current) {
      // Initialize map centered on destination
      mapRef.current = new google.maps.Map(document.getElementById(`tracking-map-${orderId}`), {
        center: { lat: destination.lat, lng: destination.lng },
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
      
      // Destination marker (customer location)
      new google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lng },
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF'
        },
        title: 'Delivery Destination'
      });
    }
    
    // Update or create delivery marker
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        position: { lat: pos.lat, lng: pos.lng },
        map: mapRef.current,
        icon: {
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTUiIGZpbGw9IiM0NjZmZGQiLz4KPHBhdGggZD0iTTIwIDlWMTlNMTYgMTVIMjQiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==',
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        },
        title: 'Delivery Person'
      });
    } else {
      markerRef.current.setPosition({ lat: pos.lat, lng: pos.lng });
      
      // Smooth animation
      markerRef.current.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => markerRef.current.setAnimation(null), 1500);
    }
    
    // Center map between delivery and destination
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: destination.lat, lng: destination.lng });
    bounds.extend({ lat: pos.lat, lng: pos.lng });
    mapRef.current.fitBounds(bounds, { padding: 50 });
  };
  
  // Status indicator text
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return 'Connecting to delivery tracking...';
      case 'connected': return 'Connected, waiting for location...';
      case 'live': return 'Live tracking active';
      case 'disconnected': return 'Connection lost - reconnecting...';
      case 'error': return 'Tracking error - refreshing...';
      default: return 'Waiting for connection...';
    }
  };
  
  if (!isLoaded) return <div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading map...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">Failed to load map</div>;
  
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2 text-blue-500">🚚</span>
          Live Delivery Tracking
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          connectionStatus === 'live' ? 'bg-green-100 text-green-800' :
          connectionStatus === 'connected' ? 'bg-blue-100 text-blue-800' :
          'bg-amber-100 text-amber-800'
        }`}>
          {getStatusText()}
        </div>
      </div>
      
      <div id={`tracking-map-${orderId}`} className="w-full h-64 rounded-lg mb-3 border border-gray-300"></div>
      
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Delivery Person</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Your Location</span>
        </div>
        <div className="text-gray-600 flex items-center">
          {connectionStatus === 'live' && deliveryPosition ? (
            <>
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
              Live updating
            </>
          ) : (
            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
          )}
          {getStatusText()}
        </div>
      </div>
    </div>
  );
}