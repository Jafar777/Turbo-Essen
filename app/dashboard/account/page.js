// app/dashboard/account/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';
import { showToast } from '@/lib/toast';

export default function AccountPage() {
  const { data: session, update } = useSession();
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    image: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (session?.user) {
      setUserData({
        firstName: session.user.firstName || '',
        lastName: session.user.lastName || '',
        email: session.user.email || '',
        image: session.user.image || ''
      });
    }
  }, [session]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
            showToast.success('Profile updated successfully!');

        // Update session to reflect changes immediately
        await update();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            showToast.error(data.error || 'Failed to update profile');

      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (result) => {
    if (result.event === 'success') {
      setUserData(prev => ({
        ...prev,
        image: result.info.secure_url
      }));
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
          showToast.success('Image uploaded successfully!');

    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ce5a46] to-[#D22E26] rounded-t-2xl p-6 text-white">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-amber-100 mt-2">
          Manage your profile information, {session?.user?.firstName}!
        </p>
      </div>

      <div className="bg-white rounded-b-2xl shadow-lg border border-amber-100 overflow-hidden">
        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-8">
            {/* Profile Image Upload */}
            <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-amber-100">
              <div className="flex-shrink-0">
                <div className="relative">
                  {userData.image ? (
                    <Image
                      src={userData.image}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="rounded-full border-4 border-amber-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-amber-100 border-4 border-amber-200 flex items-center justify-center shadow-lg">
                      <span className="text-amber-600 text-2xl font-bold">
                        {userData.firstName?.[0]}{userData.lastName?.[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Profile Photo</h3>
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  onSuccess={handleImageUpload}
                  options={{
                    multiple: false,
                    resourceType: 'image',
                    cropping: true,
                    croppingAspectRatio: 1,
                    croppingDefaultSelectionRatio: 0.9,
                    showSkipCropButton: false,
                    styles: {
                      palette: {
                        window: "#FFFFFF",
                        sourceBg: "#F4F4F5",
                        windowBorder: "#FBBF24",
                        tabIcon: "#EA580C",
                        inactiveTabIcon: "#E5E7EB",
                        menuIcons: "#EA580C",
                        link: "#EA580C",
                        action: "#EA580C",
                        inProgress: "#0194c7",
                        complete: "#10B981",
                        error: "#EF4444",
                        textDark: "#000000",
                        textLight: "#FFFFFF"
                      }
                    }
                  }}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Upload New Photo
                    </button>
                  )}
                </CldUploadWidget>
                <p className="text-sm text-gray-600">
                  Recommended: Square image, at least 400x400 pixels. JPG, PNG, or WebP.
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-amber-100 pb-2">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={userData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-amber-50/30"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={userData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-amber-50/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-amber-50/30"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-amber-100">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={() => setUserData({
                  firstName: session.user.firstName || '',
                  lastName: session.user.lastName || '',
                  email: session.user.email || '',
                  image: session.user.image || ''
                })}
                className="flex-1 px-6 py-3 border border-amber-300 text-amber-700 hover:bg-amber-50 font-medium rounded-lg transition-colors duration-200"
              >
                Reset Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}