// app/dashboard/applications/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchApplications();
  }, [session, status, router]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId, action) => {
    setProcessing(applicationId);
    
    try {
      const response = await fetch('/api/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action
        }),
      });

      if (response.ok) {
        // Remove the processed application from the list
        setApplications(applications.filter(app => app._id !== applicationId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || `Failed to ${action} application`);
      }
    } catch (error) {
      console.error('Error processing application:', error);
      alert('Error processing application. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="animate-pulse">Loading applications...</div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <h1 className="text-3xl font-bold">Restaurant Applications</h1>
          <p className="text-blue-100 mt-2">
            Review and manage restaurant applications
          </p>
        </div>

        <div className="p-6">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl">No pending applications</p>
              <p className="mt-2">All applications have been processed.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {applications.map((application) => (
                <div key={application._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.restaurantName}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {application.cuisineType}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Address</p>
                        <p className="text-sm text-gray-600">{application.address}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-sm text-gray-600">{application.phone}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Applicant</p>
                        <p className="text-sm text-gray-600">
                          {application.userId?.firstName} {application.userId?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{application.userId?.email}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Description</p>
                      <p className="text-sm text-gray-600 mt-1">{application.description}</p>
                    </div>

                    {application.location?.coordinates && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Location</p>
                        <p className="text-sm text-gray-600">
                          {application.location.coordinates[1]?.toFixed(6)}, {application.location.coordinates[0]?.toFixed(6)}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => handleApplicationAction(application._id, 'accept')}
                        disabled={processing === application._id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === application._id ? 'Processing...' : 'Accept'}
                      </button>
                      
                      <button
                        onClick={() => handleApplicationAction(application._id, 'reject')}
                        disabled={processing === application._id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === application._id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}