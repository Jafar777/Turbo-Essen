// app/dashboard/restaurant-workers/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RestaurantWorkersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees'); // Default to employees tab
  const [sentOffers, setSentOffers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [updatingEmployee, setUpdatingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'chef',
    message: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (session.user.role !== 'restaurant_owner') {
      router.push('/dashboard');
      return;
    }
    
    fetchRestaurant();
    fetchSentOffers();
    fetchEmployees();
  }, [session, status, router]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch('/api/restaurants/my-restaurant');
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentOffers = async () => {
    try {
      const response = await fetch('/api/job-offers/sent');
      if (response.ok) {
        const data = await response.json();
        setSentOffers(data.offers || []);
      }
    } catch (error) {
      console.error('Error fetching sent offers:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/restaurants/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      const response = await fetch('/api/job-offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetEmail: formData.email,
          role: formData.role,
          message: formData.message,
          restaurantId: restaurant._id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Job offer sent successfully!');
        setFormData({ email: '', role: 'chef', message: '' });
        fetchSentOffers();
        setActiveTab('sent-offers');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send job offer');
      }
    } catch (error) {
      console.error('Error sending job offer:', error);
      alert('Failed to send job offer');
    }
  };

  const handleWithdrawOffer = async (offerId) => {
    if (!confirm('Are you sure you want to withdraw this job offer?')) return;

    try {
      const response = await fetch(`/api/job-offers/${offerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSentOffers();
        alert('Job offer withdrawn successfully');
      } else {
        alert('Failed to withdraw job offer');
      }
    } catch (error) {
      console.error('Error withdrawing job offer:', error);
      alert('Failed to withdraw job offer');
    }
  };

  const handleUpdateEmployeeRole = async (employeeId, newRole) => {
    setUpdatingEmployee(employeeId);
    try {
      const response = await fetch('/api/restaurants/employees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          newRole
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Employee role updated successfully');
        fetchEmployees(); // Refresh the employees list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update employee role');
      }
    } catch (error) {
      console.error('Error updating employee role:', error);
      alert('Failed to update employee role');
    } finally {
      setUpdatingEmployee(null);
    }
  };

  const handleRemoveEmployee = async (employeeId) => {
    if (!confirm('Are you sure you want to remove this employee? They will lose access to your restaurant.')) return;
    
    // Removing an employee means setting their role to 'user'
    await handleUpdateEmployeeRole(employeeId, 'user');
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      chef: 'bg-orange-100 text-orange-800',
      waiter: 'bg-blue-100 text-blue-800',
      delivery: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800'
    };

    const roleLabels = {
      chef: 'Chef',
      waiter: 'Waiter',
      delivery: 'Delivery Person',
      user: 'User'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleStyles[role]}`}>
        {roleLabels[role]}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-amber-200 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-amber-100 rounded w-1/2 mx-auto"></div>
              <div className="h-64 bg-amber-100 rounded-lg mt-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'restaurant_owner') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Restaurant Workers
              </h1>
              <p className="text-amber-100 text-xl max-w-2xl mx-auto leading-relaxed">
                Manage your team and send job offers to potential employees
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8">
          <div className="flex flex-col sm:flex-row">
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex-1 group px-8 py-6 font-semibold text-lg transition-all duration-300 relative overflow-hidden ${
                activeTab === 'employees'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">👥</span>
                <span>Employees ({employees.length})</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('send-offer')}
              className={`flex-1 group px-8 py-6 font-semibold text-lg transition-all duration-300 relative overflow-hidden ${
                activeTab === 'send-offer'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">📨</span>
                <span>Send Job Offer</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('sent-offers')}
              className={`flex-1 group px-8 py-6 font-semibold text-lg transition-all duration-300 relative overflow-hidden ${
                activeTab === 'sent-offers'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">📋</span>
                <span>Sent Offers</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Employees</h2>
              {employees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No employees yet</h3>
                  <p className="mb-4">You havent hired any employees for your restaurant.</p>
                  <button
                    onClick={() => setActiveTab('send-offer')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
                  >
                    Send Job Offers
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {employee.firstName} {employee.lastName}
                              </h3>
                              <p className="text-gray-600 text-sm">{employee.email}</p>
                            </div>
                            {getRoleBadge(employee.role)}
                          </div>
                          <p className="text-gray-600 text-sm">
                            Joined: {new Date(employee.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
                          {/* Role Change Dropdown */}
                          <select
                            value={employee.role}
                            onChange={(e) => handleUpdateEmployeeRole(employee._id, e.target.value)}
                            disabled={updatingEmployee === employee._id}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
                          >
                            <option value="chef">Chef</option>
                            <option value="waiter">Waiter</option>
                            <option value="delivery">Delivery Person</option>
                          </select>
                          
                          {/* Remove Employee Button */}
                          <button
                            onClick={() => handleRemoveEmployee(employee._id)}
                            disabled={updatingEmployee === employee._id}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                          >
                            {updatingEmployee === employee._id ? 'Updating...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send Offer Tab */}
          {activeTab === 'send-offer' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Job Offer</h2>
              <form onSubmit={handleSendOffer} className="max-w-2xl space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter user's email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="chef">Chef</option>
                    <option value="waiter">Waiter</option>
                    <option value="delivery">Delivery Person</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Add a personal message for the job offer..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
                >
                  Send Job Offer
                </button>
              </form>
            </div>
          )}

          {/* Sent Offers Tab */}
          {activeTab === 'sent-offers' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sent Job Offers</h2>
              {sentOffers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-xl">No job offers sent yet</p>
                  <p className="mt-2">Send your first job offer using the Send Job Offer tab.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentOffers.map((offer) => (
                    <div key={offer._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="font-semibold text-gray-900">{offer.targetEmail}</h3>
                            {getRoleBadge(offer.role)}
                            {getStatusBadge(offer.status)}
                          </div>
                          <p className="text-gray-600 text-sm">
                            Sent: {new Date(offer.createdAt).toLocaleDateString()}
                            {offer.expiresAt && (
                              <span className="ml-4">
                                Expires: {new Date(offer.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                          {offer.message && (
                            <p className="text-gray-700 mt-2">{offer.message}</p>
                          )}
                        </div>
                        {offer.status === 'pending' && (
                          <button
                            onClick={() => handleWithdrawOffer(offer._id)}
                            className="mt-4 sm:mt-0 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}