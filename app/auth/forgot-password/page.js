// app/auth/forgot-password/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import Image from "next/image";
import { showToast } from '@/lib/toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [error, setError] = useState('');
  const router = useRouter();
  
  const languageContext = useLanguage();
  const language = languageContext?.language || 'en';
  const translations = languageContext?.translations || {};
  const t = translations[language] || {};

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('Reset code sent to your email!');
        setStep(2);
      } else {
        setError(data.error || 'Failed to send reset code');
        showToast.error(data.error || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Network error occurred');
      showToast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          code: resetCode 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('Code verified! Set your new password.');
        setStep(3);
      } else {
        setError(data.error || 'Invalid or expired code');
        showToast.error(data.error || 'Invalid or expired code');
      }
    } catch (err) {
      setError('Network error occurred');
      showToast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      showToast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      showToast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          code: resetCode,
          newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('Password reset successfully!');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password');
        showToast.error(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error occurred');
      showToast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Image
        src="/stoppage.png"
        alt="stoppage.png Background"
        fill
        className="object-cover z-[-1]"
        priority
      />
      <Navbar />

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="p-8 rounded-lg shadow-md w-full max-w-md bg-gray-100">
          <h2 className="text-black text-2xl font-bold mb-6 text-center">
            {step === 1 && 'Reset Your Password'}
            {step === 2 && 'Enter Verification Code'}
            {step === 3 && 'Set New Password'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleSendResetCode}>
              <div className="mb-6">
                <p className="text-black mb-4 text-center">
                  Enter your email address and we'll send you a verification code to reset your password.
                </p>
                <label className="block text-black mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-black w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D22E26] text-white py-3 px-4 rounded-lg hover:bg-[#2d4360] transition duration-200 cursor-pointer mb-4 disabled:opacity-50"
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/auth/signin')}
                  className="text-[#375171] hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyResetCode}>
              <div className="mb-6">
                <p className="text-black mb-4 text-center">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
                <label className="block text-black mb-2" htmlFor="resetCode">
                  Verification Code
                </label>
                <input
                  id="resetCode"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-black w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || resetCode.length !== 6}
                className="w-full bg-[#D22E26] text-white py-3 px-4 rounded-lg hover:bg-[#2d4360] transition duration-200 cursor-pointer mb-4 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="text-[#375171] hover:underline cursor-pointer block w-full"
                >
                  Use different email
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/auth/signin')}
                  className="text-[#375171] hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="mb-6">
                <p className="text-black mb-4 text-center">
                  Enter your new password below.
                </p>
                
                <div className="mb-4">
                  <label className="block text-black mb-2" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="text-black w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-black mb-2" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-black w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                    placeholder="Confirm your password"
                    minLength={6}
                    required
                  />
                </div>

                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-500 text-sm mt-2">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200 cursor-pointer mb-4 disabled:opacity-50"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="text-[#375171] hover:underline cursor-pointer"
                >
                  Start Over
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}