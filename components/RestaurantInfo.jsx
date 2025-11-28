// components/RestaurantInfo.jsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { FiSettings, FiImage, FiClock, FiInfo, FiTag, FiUpload, FiX, FiCheck, FiAlertCircle, FiTruck } from 'react-icons/fi';
import { IoTimeOutline } from 'react-icons/io5';

export default function RestaurantInfo({ restaurant, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    cuisineType: '',
    totalTables: 10,
    availableTables: 10,
    isOpen: true,
    orderTypes: ['dine_in', 'delivery', 'takeaway'],
    openingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '23:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '21:00', closed: false }
    },

    deliveryTime: {
      min: 30,
      max: 45
    },
    deliveryFee: 2.99,
    freeDeliveryThreshold: 25
  });

  // Promo code management state
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    isActive: true,
    validUntil: '',
    usageLimit: '',
    usedCount: 0
  });

  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [openingHoursLoading, setOpeningHoursLoading] = useState(false);
  const [orderTypesLoading, setOrderTypesLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activePromoTab, setActivePromoTab] = useState('active');
  const [editingPromo, setEditingPromo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [suddenCloseLoading, setSuddenCloseLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('status');

  const scrollPositionRef = useRef(0);
  const formRef = useRef(null);
  const imagesSectionRef = useRef(null);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    };
  }, []);

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        cuisineType: restaurant.cuisineType || '',
        totalTables: restaurant.totalTables || 10,
        availableTables: restaurant.availableTables || 10,
        isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : true,
        orderTypes: restaurant.orderTypes || ['dine_in', 'delivery', 'takeaway'],
        openingHours: restaurant.openingHours || {
          monday: { open: '09:00', close: '22:00', closed: false },
          tuesday: { open: '09:00', close: '22:00', closed: false },
          wednesday: { open: '09:00', close: '22:00', closed: false },
          thursday: { open: '09:00', close: '22:00', closed: false },
          friday: { open: '09:00', close: '23:00', closed: false },
          saturday: { open: '10:00', close: '23:00', closed: false },
          sunday: { open: '10:00', close: '21:00', closed: false }
        },
        // Load delivery settings from restaurant
        deliveryTime: restaurant.deliveryTime || { min: 30, max: 45 },
        deliveryFee: restaurant.deliveryFee ?? 2.99,
        freeDeliveryThreshold: restaurant.freeDeliveryThreshold || 25
      });
      setAvatarUrl(restaurant.avatar || '');
      setBannerUrl(restaurant.banner || '');
      fetchPromoCodes();
    }
  }, [restaurant]);

  // Helper function to safely parse time strings
  const parseTimeToMinutes = (timeString, fallback = '00:00') => {
    if (!timeString || typeof timeString !== 'string') {
      timeString = fallback;
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    return isNaN(hours) || isNaN(minutes) ? 0 : (hours * 60 + minutes);
  };

  const getCurrentStatus = () => {
    if (!formData.isOpen) return false;

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    const todayHours = formData.openingHours?.[today];

    if (!todayHours || todayHours.closed) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTimeInMinutes = parseTimeToMinutes(todayHours?.open, '09:00');
    const closeTimeInMinutes = parseTimeToMinutes(todayHours?.close, '22:00');

    if (closeTimeInMinutes < openTimeInMinutes) {
      if (currentTime >= openTimeInMinutes) {
        return true;
      } else if (currentTime < closeTimeInMinutes) {
        return true;
      }
      return false;
    }

    return currentTime >= openTimeInMinutes && currentTime <= closeTimeInMinutes;
  };

  const saveScrollPosition = () => {
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    sessionStorage.setItem('restaurantInfoScrollPos', scrollPositionRef.current.toString());
  };

  const restoreScrollPosition = () => {
    const savedPosition = scrollPositionRef.current ||
      parseInt(sessionStorage.getItem('restaurantInfoScrollPos') || '0');

    requestAnimationFrame(() => {
      window.scrollTo(0, savedPosition);
    });

    sessionStorage.removeItem('restaurantInfoScrollPos');
  };

  const scrollToSection = (sectionRef) => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const fetchPromoCodes = async () => {
    if (!restaurant?._id) return;

    try {
      setPromoLoading(true);
      const response = await fetch(`/api/restaurants/${restaurant._id}/promo-codes`);
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.promoCodes || []);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      setMessage({ type: 'error', text: 'Failed to load promo codes' });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleAvatarUpload = (result) => {
    if (result.event === 'success') {
      setAvatarUrl(result.info.secure_url);
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
      setTimeout(() => {
        restoreScrollPosition();
      }, 100);
    }
  };

  const handleBannerUpload = (result) => {
    if (result.event === 'success') {
      setBannerUrl(result.info.secure_url);
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
      setTimeout(() => {
        restoreScrollPosition();
      }, 100);
    }
  };

  const handleImageDelete = async (imageType) => {
    if (!confirm(`Are you sure you want to remove the ${imageType} image?`)) {
      return;
    }

    saveScrollPosition();

    try {
      if (imageType === 'avatar') {
        setAvatarUrl('');
      } else {
        setBannerUrl('');
      }

      const response = await fetch(`/api/restaurants/${restaurant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [imageType]: ''
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${imageType} image removed successfully!` });
        onUpdate();
        restoreScrollPosition();
      }
    } catch (error) {
      console.error('Error removing image:', error);
      setMessage({ type: 'error', text: `Failed to remove ${imageType} image` });
    }
  };

  const formatTimeTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    if (isNaN(hour)) return '';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Add sudden close functionality
  const handleSuddenClose = async () => {
    if (!restaurant) return;

    setSuddenCloseLoading(true);
    try {
      const newStatus = !formData.isOpen;
      const response = await fetch(`/api/restaurants/${restaurant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOpen: newStatus
        })
      });

      if (response.ok) {
        setFormData(prev => ({ ...prev, isOpen: newStatus }));
        setMessage({
          type: 'success',
          text: `Restaurant ${newStatus ? 'opened' : 'closed'} successfully!`
        });
        onUpdate();
      } else {
        setMessage({ type: 'error', text: 'Failed to update restaurant status' });
      }
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      setMessage({ type: 'error', text: 'Error updating restaurant status' });
    } finally {
      setSuddenCloseLoading(false);
    }
  };
  // Save delivery settings to database
  const handleSaveDeliverySettings = async () => {
    if (!restaurant) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/restaurants/${restaurant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryTime: formData.deliveryTime,
          deliveryFee: formData.deliveryFee,
          freeDeliveryThreshold: formData.freeDeliveryThreshold
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Delivery settings updated successfully!' });
        onUpdate();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to update delivery settings' });
      }
    } catch (error) {
      console.error('Error updating delivery settings:', error);
      setMessage({ type: 'error', text: 'Error updating delivery settings' });
    } finally {
      setLoading(false);
    }
  };
  // Add opening hours handlers
  const handleOpeningHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: field === 'closed' ? value : value
        }
      }
    }));
  };

  // Save opening hours to database
  const handleSaveOpeningHours = async () => {
    if (!restaurant) return;

    setOpeningHoursLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/restaurants/${restaurant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openingHours: formData.openingHours
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Opening hours updated successfully!' });
        onUpdate();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to update opening hours' });
      }
    } catch (error) {
      console.error('Error updating opening hours:', error);
      setMessage({ type: 'error', text: 'Error updating opening hours' });
    } finally {
      setOpeningHoursLoading(false);
    }
  };

  // Save order types to database
  const handleSaveOrderTypes = async () => {
    if (!restaurant) return;

    setOrderTypesLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/restaurants/${restaurant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderTypes: formData.orderTypes
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Order types updated successfully!' });
        onUpdate();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to update order types' });
      }
    } catch (error) {
      console.error('Error updating order types:', error);
      setMessage({ type: 'error', text: 'Error updating order types' });
    } finally {
      setOrderTypesLoading(false);
    }
  };

  // Reset opening hours to original values
  const handleResetOpeningHours = () => {
    if (restaurant && restaurant.openingHours) {
      setFormData(prev => ({
        ...prev,
        openingHours: restaurant.openingHours
      }));
      setMessage({ type: 'info', text: 'Opening hours reset to saved values' });
    }
  };

  // Reset order types to original values
  const handleResetOrderTypes = () => {
    if (restaurant) {
      setFormData(prev => ({
        ...prev,
        orderTypes: restaurant.orderTypes || ['dine_in', 'delivery', 'takeaway']
      }));
      setMessage({ type: 'info', text: 'Order types reset to saved values' });
    }
  };

  const handleEditPromoCode = (promo) => {
    setEditingPromo(promo);
    setPromoForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      isActive: promo.isActive,
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : '',
      usageLimit: promo.usageLimit ? promo.usageLimit.toString() : '',
      usedCount: promo.usedCount || 0
    });
    setIsEditing(true);
  };

  const handleSavePromoCode = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!promoForm.code.trim()) {
      setMessage({ type: 'error', text: 'Promo code is required' });
      return;
    }

    if (!promoForm.discountValue || parseFloat(promoForm.discountValue) <= 0) {
      setMessage({ type: 'error', text: 'Valid discount value is required' });
      return;
    }

    try {
      const url = isEditing
        ? `/api/restaurants/${restaurant._id}/promo-codes/${editingPromo._id}`
        : `/api/restaurants/${restaurant._id}/promo-codes`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...promoForm,
          discountValue: parseFloat(promoForm.discountValue),
          usageLimit: promoForm.usageLimit ? parseInt(promoForm.usageLimit) : null
        })
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Promo code ${isEditing ? 'updated' : 'added'} successfully!`
        });
        resetPromoForm();
        fetchPromoCodes();
        onUpdate();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || `Failed to ${isEditing ? 'update' : 'add'} promo code` });
      }
    } catch (error) {
      console.error('Failed to save promo code', error);
      setMessage({ type: 'error', text: `Error ${isEditing ? 'updating' : 'adding'} promo code` });
    }
  };

  const resetPromoForm = () => {
    setPromoForm({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      isActive: true,
      validUntil: '',
      usageLimit: '',
      usedCount: 0
    });
    setEditingPromo(null);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePromoInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPromoForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/restaurants/${restaurant._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          avatar: avatarUrl,
          banner: bannerUrl
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Restaurant information updated successfully!' });
        onUpdate();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to update restaurant information' });
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      setMessage({ type: 'error', text: 'Error updating restaurant information' });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePromoStatus = async (promoId, currentStatus) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurant._id}/promo-codes/${promoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Promo code ${!currentStatus ? 'activated' : 'deactivated'}!` });
        fetchPromoCodes();
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating promo code:', error);
      setMessage({ type: 'error', text: 'Failed to update promo code' });
    }
  };

  const handleDeletePromoCode = async (promoId) => {
    if (!confirm('Are you sure you want to delete this promo code?')) {
      return;
    }

    try {
      const response = await fetch(`/api/restaurants/${restaurant._id}/promo-codes/${promoId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Promo code deleted successfully!' });
        fetchPromoCodes();
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      setMessage({ type: 'error', text: 'Failed to delete promo code' });
    }
  };

  const filteredPromoCodes = promoCodes.filter(promo => {
    if (activePromoTab === 'active') return promo.isActive;
    if (activePromoTab === 'inactive') return !promo.isActive;
    return true;
  });

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const navigationItems = [
    { id: 'status', label: 'Business Status', icon: FiSettings },
    { id: 'images', label: 'Brand Assets', icon: FiImage },
    { id: 'hours', label: 'Operating Hours', icon: FiClock },
    { id: 'orderTypes', label: 'Order Types', icon: FiTag },
    { id: 'delivery', label: 'Delivery Settings', icon: FiTruck }, // Add this line
    { id: 'info', label: 'Business Profile', icon: FiInfo },
    { id: 'promotions', label: 'Promotions', icon: FiTag },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Restaurant Management</h1>
              <p className="text-gray-600 mt-1">Manage your business settings and operations</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCurrentStatus()
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {getCurrentStatus() ? 'Currently Open' : 'Currently Closed'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeSection === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-white hover:shadow-md'
                      }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl border-l-4 ${message.type === 'success'
                ? 'bg-green-50 border-green-500 text-green-700'
                : message.type === 'error'
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : 'bg-blue-50 border-blue-500 text-blue-700'
                }`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <FiCheck className="w-5 h-5 mr-2" />
                  ) : message.type === 'error' ? (
                    <FiAlertCircle className="w-5 h-5 mr-2" />
                  ) : (
                    <FiInfo className="w-5 h-5 mr-2" />
                  )}
                  {message.text}
                </div>
              </div>
            )}

            {/* Business Status Section */}
            {activeSection === 'status' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Business Status</h2>
                      <p className="text-gray-600 mt-1">Manage your restaurant's operational status</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getCurrentStatus()
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {getCurrentStatus() ? 'OPEN FOR BUSINESS' : 'TEMPORARILY CLOSED'}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Current Status</h3>
                        <p className="text-gray-600 text-sm">
                          {getCurrentStatus()
                            ? 'Your restaurant is currently open and accepting orders from customers.'
                            : 'Your restaurant is currently closed and not accepting orders.'
                          }
                        </p>
                        <div className="mt-3 text-xs text-gray-500">
                          Based on current time: {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <button
                          onClick={handleSuddenClose}
                          disabled={suddenCloseLoading}
                          className={`w-full px-6 py-3 font-semibold rounded-xl transition-all duration-200 ${formData.isOpen
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                            : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {suddenCloseLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating...
                            </div>
                          ) : (
                            formData.isOpen ? 'Temporarily Close Restaurant' : 'Reopen Restaurant'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Brand Assets Section */}
            {activeSection === 'images' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Brand Assets</h2>
                    <p className="text-gray-600 mt-1">Manage your restaurant's visual identity</p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Banner Image */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FiImage className="w-5 h-5 mr-2 text-blue-500" />
                        Cover Image
                      </h3>
                      <div className="space-y-4">
                        {bannerUrl ? (
                          <div className="relative group">
                            <img
                              src={bannerUrl}
                              alt="Restaurant banner"
                              className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                            />
                            <button
                              onClick={() => handleImageDelete('banner')}
                              className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                            <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">No cover image uploaded</p>
                            <CldUploadWidget
                              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                              signatureEndpoint="/api/sign-cloudinary-params"
                              onSuccess={handleBannerUpload}
                              options={{
                                multiple: false,
                                resourceType: 'image',
                                cropping: true,
                                croppingAspectRatio: 3,
                                showSkipCropButton: false,
                              }}
                            >
                              {({ open }) => (
                                <button
                                  type="button"
                                  onClick={() => open()}
                                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                                >
                                  Upload Cover Image
                                </button>
                              )}
                            </CldUploadWidget>
                          </div>
                        )}
                        <p className="text-sm text-gray-500 text-center">
                          Recommended: 1200×400px • This appears at the top of your restaurant page
                        </p>
                      </div>
                    </div>

                    {/* Avatar Image */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FiImage className="w-5 h-5 mr-2 text-blue-500" />
                        Logo
                      </h3>
                      <div className="space-y-4">
                        {avatarUrl ? (
                          <div className="relative inline-block group">
                            <img
                              src={avatarUrl}
                              alt="Restaurant profile"
                              className="w-32 h-32 object-cover rounded-2xl border-4 border-white shadow-xl group-hover:shadow-2xl transition-all duration-300"
                            />
                            <button
                              onClick={() => handleImageDelete('avatar')}
                              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-2xl w-32 h-32 flex items-center justify-center mx-auto hover:border-blue-400 transition-colors">
                            <CldUploadWidget
                              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                              signatureEndpoint="/api/sign-cloudinary-params"
                              onSuccess={handleAvatarUpload}
                              options={{
                                multiple: false,
                                resourceType: 'image',
                                cropping: true,
                                croppingAspectRatio: 1,
                                showSkipCropButton: false,
                              }}
                            >
                              {({ open }) => (
                                <button
                                  type="button"
                                  onClick={() => open()}
                                  className="text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                  <FiUpload className="w-8 h-8" />
                                </button>
                              )}
                            </CldUploadWidget>
                          </div>
                        )}
                        <p className="text-sm text-gray-500 text-center">
                          Recommended: 400×400px • Your restaurant's primary identifier
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Operating Hours Section */}
            {activeSection === 'hours' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Operating Hours</h2>
                    <p className="text-gray-600 mt-1">Set your regular business hours</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {daysOfWeek.map((day) => {
                      const dayHours = formData.openingHours[day.key] || { open: '09:00', close: '22:00', closed: false };
                      const openTime = dayHours.open || '09:00';
                      const closeTime = dayHours.close || '22:00';
                      const isClosed = dayHours.closed || false;

                      return (
                        <div key={day.key} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-6">
                            <span className="font-semibold text-gray-900 w-28">{day.label}</span>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={!isClosed}
                                onChange={(e) => handleOpeningHoursChange(day.key, 'closed', !e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Open for business</span>
                            </label>
                          </div>

                          {!isClosed && (
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="time"
                                  value={openTime}
                                  onChange={(e) => handleOpeningHoursChange(day.key, 'open', e.target.value)}
                                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                />
                                <span className="text-sm text-gray-500 font-medium">
                                  {formatTimeTo12Hour(openTime)}
                                </span>
                              </div>
                              <span className="text-gray-400 font-bold">–</span>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="time"
                                  value={closeTime}
                                  onChange={(e) => handleOpeningHoursChange(day.key, 'close', e.target.value)}
                                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                />
                                <span className="text-sm text-gray-500 font-medium">
                                  {formatTimeTo12Hour(closeTime)}
                                </span>
                              </div>
                            </div>
                          )}

                          {isClosed && (
                            <span className="text-red-500 text-sm font-semibold bg-red-50 px-3 py-1 rounded-full">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Save Opening Hours Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleResetOpeningHours}
                      className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl transition-colors duration-200"
                    >
                      Reset Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveOpeningHours}
                      disabled={openingHoursLoading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {openingHoursLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving Hours...
                        </div>
                      ) : (
                        'Save Opening Hours'
                      )}
                    </button>
                  </div>

                  {/* Preview Section */}
                  <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
                    <h3 className="text-lg font-semibold text-amber-900 mb-4">Preview on Restaurant Card</h3>
                    <div className="flex items-center space-x-2">
                      <FiClock className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-800 font-medium">
                        {(() => {
                          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                          const today = new Date().getDay();
                          const todayKey = days[today];
                          const todayHours = formData.openingHours[todayKey];

                          if (!todayHours || todayHours.closed) {
                            return 'Closed today';
                          }

                          const openTime = todayHours.open || '09:00';
                          const closeTime = todayHours.close || '22:00';

                          if (!openTime || !closeTime) {
                            return 'Hours not set';
                          }

                          return `${formatTimeTo12Hour(openTime)} - ${formatTimeTo12Hour(closeTime)}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Types Section */}
            {activeSection === 'orderTypes' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Order Types</h2>
                    <p className="text-gray-600 mt-1">Choose which order types you want to accept</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FiTag className="w-5 h-5 mr-2 text-blue-500" />
                        Available Order Types
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Select the types of orders you want to accept from customers. Disabled order types will not appear as options in the cart.
                      </p>

                      <div className="space-y-4">
                        {/* Dine In Option */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <span className="text-green-600 text-lg">🍽️</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Dine In</h4>
                              <p className="text-sm text-gray-600">Customers eat at your restaurant</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.orderTypes?.includes('dine_in') || false}
                              onChange={(e) => {
                                const newOrderTypes = e.target.checked
                                  ? [...(formData.orderTypes || []), 'dine_in']
                                  : (formData.orderTypes || []).filter(type => type !== 'dine_in');
                                setFormData(prev => ({ ...prev, orderTypes: newOrderTypes }));
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Delivery Option */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 text-lg">🚚</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Delivery</h4>
                              <p className="text-sm text-gray-600">Food delivered to customer's location</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.orderTypes?.includes('delivery') || false}
                              onChange={(e) => {
                                const newOrderTypes = e.target.checked
                                  ? [...(formData.orderTypes || []), 'delivery']
                                  : (formData.orderTypes || []).filter(type => type !== 'delivery');
                                setFormData(prev => ({ ...prev, orderTypes: newOrderTypes }));
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Takeaway Option */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                              <span className="text-amber-600 text-lg">📦</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Takeaway</h4>
                              <p className="text-sm text-gray-600">Customers pick up their orders</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.orderTypes?.includes('takeaway') || false}
                              onChange={(e) => {
                                const newOrderTypes = e.target.checked
                                  ? [...(formData.orderTypes || []), 'takeaway']
                                  : (formData.orderTypes || []).filter(type => type !== 'takeaway');
                                setFormData(prev => ({ ...prev, orderTypes: newOrderTypes }));
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      {/* Info Message */}
                      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start space-x-3">
                          <FiInfo className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-amber-800 font-medium">Order Type Requirements</p>
                            <p className="text-sm text-amber-700 mt-1">
                              • Dine In: Requires table management setup<br />
                              • Delivery: Requires delivery location mapping<br />
                              • Takeaway: Simple pickup system
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={handleResetOrderTypes}
                          className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl transition-colors duration-200"
                        >
                          Reset Changes
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveOrderTypes}
                          disabled={orderTypesLoading}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                          {orderTypesLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving Changes...
                            </div>
                          ) : (
                            'Save Order Types'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'delivery' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Delivery Settings</h2>
                    <p className="text-gray-600 mt-1">Configure your delivery time estimates and fees</p>
                  </div>

                  <div className="space-y-8">
                    {/* Delivery Time Settings */}
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <IoTimeOutline className="w-5 h-5 mr-2 text-blue-500" />
                        Estimated Delivery Time
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Set the expected delivery time range that customers will see on your restaurant card.
                      </p>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Minimum Delivery Time (minutes)
                          </label>
                          <input
                            type="number"
                            name="deliveryTimeMin"
                            min="5"
                            max="180"
                            value={formData.deliveryTime?.min || 30}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              deliveryTime: {
                                ...prev.deliveryTime,
                                min: parseInt(e.target.value) || 30
                              }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minimum: 5 minutes</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Maximum Delivery Time (minutes)
                          </label>
                          <input
                            type="number"
                            name="deliveryTimeMax"
                            min="10"
                            max="180"
                            value={formData.deliveryTime?.max || 45}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              deliveryTime: {
                                ...prev.deliveryTime,
                                max: parseInt(e.target.value) || 45
                              }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                          <p className="text-xs text-gray-500 mt-1">Maximum: 180 minutes</p>
                        </div>
                      </div>

                      {formData.deliveryTime?.min >= formData.deliveryTime?.max && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 text-sm">
                            Maximum delivery time must be greater than minimum delivery time.
                          </p>
                        </div>
                      )}

                      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Preview:</h4>
                        <div className="flex items-center text-gray-700">
                          <IoTimeOutline className="w-4 h-4 mr-2 text-amber-500" />
                          <span className="font-medium">
                            {formData.deliveryTime?.min || 30}-{formData.deliveryTime?.max || 45} min
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Fee Settings */}
                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FiTag className="w-5 h-5 mr-2 text-green-500" />
                        Delivery Fee & Free Delivery
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Set your delivery fee and the minimum order amount for free delivery.
                      </p>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Delivery Fee ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="50"
                            name="deliveryFee"
                            value={formData.deliveryFee ?? 2.99}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              deliveryFee: e.target.value === '' ? null : parseFloat(e.target.value)
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                          <p className="text-xs text-gray-500 mt-1">Set to 0 for free delivery</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Free Delivery Threshold ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="200"
                            name="freeDeliveryThreshold"
                            value={formData.freeDeliveryThreshold || 25}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              freeDeliveryThreshold: parseFloat(e.target.value) || 0
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                          <p className="text-xs text-gray-500 mt-1">Orders above this amount get free delivery</p>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Preview:</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700">Delivery Fee:</span>
                            <span className="font-medium">
                              {(formData.deliveryFee ?? 2.99) === 0 ? 'FREE' : `$${(formData.deliveryFee ?? 2.99).toFixed(2)}`}
                            </span>
                          </div>
                          {formData.freeDeliveryThreshold > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700">Free delivery on orders over:</span>
                              <span className="font-medium text-green-600">
                                ${(formData.freeDeliveryThreshold || 25).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          if (restaurant) {
                            setFormData(prev => ({
                              ...prev,
                              deliveryTime: restaurant.deliveryTime || { min: 30, max: 45 },
                              deliveryFee: restaurant.deliveryFee || 2.99,
                              freeDeliveryThreshold: restaurant.freeDeliveryThreshold || 25
                            }));
                          }
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl transition-colors duration-200"
                      >
                        Reset Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDeliverySettings}
                        disabled={formData.deliveryTime?.min >= formData.deliveryTime?.max}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        Save Delivery Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Business Profile Section */}
            {activeSection === 'info' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
                    <p className="text-gray-600 mt-1">Manage your restaurant's public information</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-3">
                          Restaurant Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="cuisineType" className="block text-sm font-semibold text-gray-900 mb-3">
                          Cuisine Type *
                        </label>
                        <input
                          type="text"
                          id="cuisineType"
                          name="cuisineType"
                          value={formData.cuisineType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                          placeholder="e.g., Italian, Mexican, Chinese"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-3">
                        Business Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                        placeholder="Describe your restaurant, your specialties, and what makes you unique..."
                      />
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-900 mb-3">
                        Business Address *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-3">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                        required
                      />
                    </div>

                    {/* Table Management */}
                    <div className="pt-8 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Capacity Management</h3>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Total Tables
                          </label>
                          <input
                            type="number"
                            name="totalTables"
                            min="1"
                            value={formData.totalTables}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Available Tables
                          </label>
                          <input
                            type="number"
                            name="availableTables"
                            min="0"
                            max={formData.totalTables}
                            value={formData.availableTables}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-blue-700">
                          Capacity: <span className="font-semibold">{formData.totalTables}</span> total tables,
                          <span className="font-semibold"> {formData.availableTables}</span> currently available
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          if (restaurant) {
                            setFormData(prev => ({
                              ...prev,
                              name: restaurant.name || '',
                              description: restaurant.description || '',
                              address: restaurant.address || '',
                              phone: restaurant.phone || '',
                              cuisineType: restaurant.cuisineType || '',
                              totalTables: restaurant.totalTables || 10,
                              availableTables: restaurant.availableTables || 10,
                              isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : true,
                              openingHours: restaurant.openingHours || {
                                monday: { open: '09:00', close: '22:00', closed: false },
                                tuesday: { open: '09:00', close: '22:00', closed: false },
                                wednesday: { open: '09:00', close: '22:00', closed: false },
                                thursday: { open: '09:00', close: '22:00', closed: false },
                                friday: { open: '09:00', close: '23:00', closed: false },
                                saturday: { open: '10:00', close: '23:00', closed: false },
                                sunday: { open: '10:00', close: '21:00', closed: false }
                              }
                            }));
                          }
                        }}
                        className="px-8 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl transition-colors duration-200"
                      >
                        Discard Changes
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving Changes...
                          </div>
                        ) : (
                          'Save Business Profile'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Promotions Section */}
            {activeSection === 'promotions' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Promotions</h2>
                      <p className="text-gray-600 mt-1">Manage discount codes and special offers</p>
                    </div>
                    <div className="bg-blue-50 px-4 py-2 rounded-full">
                      <span className="text-blue-700 font-semibold text-sm">
                        {promoCodes.length} active promotion(s)
                      </span>
                    </div>
                  </div>

                  {/* Add/Edit Promo Code Form */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <FiTag className="w-5 h-5 mr-2 text-blue-500" />
                      {isEditing ? 'Edit Promotion' : 'Create New Promotion'}
                    </h3>
                    <form onSubmit={handleSavePromoCode} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Promotion Code *
                        </label>
                        <input
                          type="text"
                          name="code"
                          value={promoForm.code}
                          onChange={handlePromoInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="SUMMER25"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Discount Type
                        </label>
                        <select
                          name="discountType"
                          value={promoForm.discountType}
                          onChange={handlePromoInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount ($)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Discount Value *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="discountValue"
                          value={promoForm.discountValue}
                          onChange={handlePromoInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder={promoForm.discountType === 'percentage' ? '25' : '10.00'}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Usage Limit
                        </label>
                        <input
                          type="number"
                          name="usageLimit"
                          value={promoForm.usageLimit}
                          onChange={handlePromoInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="Unlimited uses"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Valid Until
                        </label>
                        <input
                          type="date"
                          name="validUntil"
                          value={promoForm.validUntil}
                          onChange={handlePromoInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="isActive"
                            checked={promoForm.isActive}
                            onChange={handlePromoInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 font-medium">Active</span>
                        </label>
                      </div>

                      <div className="flex items-end space-x-3 md:col-span-2 lg:col-span-3">
                        <button
                          type="submit"
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                        >
                          {isEditing ? 'Update Promotion' : 'Create Promotion'}
                        </button>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={resetPromoForm}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Promo Codes List */}
                  <div>
                    <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl">
                      {['all', 'active', 'inactive'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActivePromoTab(tab)}
                          className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activePromoTab === tab
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                          {tab === 'all' && 'All Promotions'}
                          {tab === 'active' && 'Active'}
                          {tab === 'inactive' && 'Inactive'}
                        </button>
                      ))}
                    </div>

                    {promoLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-600 mt-3">Loading promotions...</p>
                      </div>
                    ) : filteredPromoCodes.length > 0 ? (
                      <div className="grid gap-4">
                        {filteredPromoCodes.map(promo => (
                          <div key={promo._id} className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
                            <div className="flex-1">
                              <div className="flex items-center space-x-6">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${promo.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                                  }`}>
                                  {promo.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                                <span className="font-mono font-bold text-lg text-gray-900">{promo.code}</span>
                                <span className="text-blue-600 font-bold text-lg">
                                  {promo.discountType === 'percentage'
                                    ? `${promo.discountValue}% OFF`
                                    : `$${promo.discountValue} OFF`}
                                </span>
                                {promo.usageLimit && (
                                  <span className="text-sm text-gray-500 font-medium">
                                    Used: {promo.usedCount || 0}/{promo.usageLimit}
                                  </span>
                                )}
                                {promo.validUntil && (
                                  <span className="text-sm text-gray-500 font-medium">
                                    Valid until: {new Date(promo.validUntil).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPromoCode(promo)}
                                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleTogglePromoStatus(promo._id, promo.isActive)}
                                className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${promo.isActive
                                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                                  }`}
                              >
                                {promo.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeletePromoCode(promo._id)}
                                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FiTag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-900 font-semibold text-lg">No promotions yet</p>
                        <p className="text-gray-600 mt-2">Create your first promotion to attract more customers!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}