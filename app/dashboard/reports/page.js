// app/dashboard/reports/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (session) {
      fetchReports();
    }
  }, [session, statusFilter, typeFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('targetType', typeFilter);

      const response = await fetch(`/api/reports?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReports(data.reports || []);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status, notes = '') => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes })
      });

      const data = await response.json();

      if (response.ok) {
        fetchReports(); // Refresh the list
      } else {
        alert(data.error || 'Failed to update report');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const deleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        fetchReports(); // Refresh the list
      } else {
        alert(data.error || 'Failed to delete report');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Reports & Analytics</h1>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm  p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports Management</h1>
        <p className="text-lg text-gray-600 mb-6">
          {session?.user?.role === 'admin' 
            ? 'Manage all user reports' 
            : 'View your submitted reports'
          }
        </p>

        {session?.user?.role === 'admin' && (
          <div className="flex space-x-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Types</option>
              <option value="restaurant">Restaurants</option>
              <option value="review">Reviews</option>
            </select>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">
              {session?.user?.role === 'admin' 
                ? 'No reports found with the current filters.' 
                : "You haven't submitted any reports yet."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report._id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg capitalize">
                      {report.targetType} Report
                    </h3>
                    <p className="text-gray-600">
                      Reported by: {report.reporterName || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status}
                    </span>
                    
                    {session?.user?.role === 'admin' && (
                      <button
                        onClick={() => deleteReport(report._id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Reason</h4>
                    <p className="capitalize">{report.reason.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Target ID</h4>
                    <p className="text-sm font-mono bg-gray-100 p-1 rounded">
                      {report.targetId}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded">{report.description}</p>
                </div>

                {report.adminNotes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-1">Admin Notes</h4>
                    <p className="text-gray-800 bg-blue-50 p-3 rounded">{report.adminNotes}</p>
                  </div>
                )}

                {session?.user?.role === 'admin' && report.status === 'pending' && (
                  <div className="flex space-x-2 pt-4 border-t">
                    <button
                      onClick={() => updateReportStatus(report._id, 'resolved', 'Issue addressed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => updateReportStatus(report._id, 'dismissed', 'No action required')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}