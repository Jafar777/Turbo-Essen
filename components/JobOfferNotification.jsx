// components/JobOfferNotification.jsx
'use client';
import { useState, useEffect } from 'react';

export default function JobOfferNotification({ notification, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [jobOfferStatus, setJobOfferStatus] = useState(null);

  // Fetch the current job offer status
  useEffect(() => {
    const fetchJobOfferStatus = async () => {
      if (notification.relatedId) {
        try {
          const response = await fetch(`/api/job-offers/${notification.relatedId}`);
          if (response.ok) {
            const data = await response.json();
            setJobOfferStatus(data.offer?.status);
          }
        } catch (error) {
          console.error('Error fetching job offer status:', error);
        }
      }
    };

    fetchJobOfferStatus();
  }, [notification.relatedId]);

  const handleResponse = async (action) => {
    setLoading(true);
    try {
      console.log('Sending job offer response:', action, 'for job offer:', notification.relatedId);
      
      const response = await fetch(`/api/job-offers/${notification.relatedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        // Update the local status immediately
        setJobOfferStatus(action === 'accept' ? 'accepted' : 'rejected');
        
        // Mark the notification as read
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notification._id })
        });
        
        onUpdate(); // Refresh notifications
        alert(`Job offer ${action}ed successfully!`);
        
        // Refresh the page to show updated role in sidebar
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to process job offer');
      }
    } catch (error) {
      console.error('Error responding to job offer:', error);
      alert('Failed to process job offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Don't show buttons if job offer is already accepted or rejected
  if (jobOfferStatus === 'accepted' || jobOfferStatus === 'rejected') {
    return (
      <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <p className="text-sm text-gray-600 font-medium text-center">
          {jobOfferStatus === 'accepted' ? '✅ You accepted this job offer' : '❌ You declined this job offer'}
        </p>
      </div>
    );
  }

  // Show loading state while checking status
  if (jobOfferStatus === null) {
    return (
      <div className="mt-4 p-4 bg-white border border-gray-300 rounded-lg">
        <div className="flex justify-center">
          <div className="animate-pulse text-sm text-gray-500">Checking offer status...</div>
        </div>
      </div>
    );
  }

  // Show buttons only for pending offers
  return (
    <div className="mt-4 p-4 bg-white border border-gray-300 rounded-lg">
      <div className="flex flex-col space-y-3">
        <p className="text-sm text-gray-600 font-medium">
          What would you like to do with this job offer?
        </p>
        <div className="flex space-x-3">
          <button
            onClick={() => handleResponse('accept')}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Processing...' : '✅ Accept Offer'}
          </button>
          <button
            onClick={() => handleResponse('reject')}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Processing...' : '❌ Decline Offer'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Once you accept, your role will be updated and you'll have access to new features.
        </p>
      </div>
    </div>
  );
}