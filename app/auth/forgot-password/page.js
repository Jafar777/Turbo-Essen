'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function ForgotPasswordPage() {
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const languageContext = useLanguage();
  
  // Add safety checks
  const language = languageContext?.language || 'en';
  const translations = languageContext?.translations || {};
  const t = translations[language] || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    // This would call your backend API to send a password reset link
    try {
      // Placeholder for API call
      setMessage(t.passwordResetSent || 'Password reset instructions sent to your mobile');
    } catch (err) {
      setError(t.passwordResetError || 'Error sending reset instructions');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-black text-2xl font-bold mb-6 text-center">
            {t.forgotPassword || 'Forgot Password'}
          </h2>
          
          {message && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-black mb-2" htmlFor="mobile">
                {t.mobile}
              </label>
              <input
                id="mobile"
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="text-black w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="09xxxxxxxx"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#375171] text-white py-2 px-4 rounded-lg hover:bg-[#2d4360] transition duration-200 cursor-pointer mb-4"
            >
              {t.resetPassword || 'Reset Password'}
            </button>
            
            <div className="text-center">
              <Link 
                href="/auth/signin" 
                className="text-[#375171] hover:underline"
              >
                {t.backToSignIn || 'Back to Sign In'}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}