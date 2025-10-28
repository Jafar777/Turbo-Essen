'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import Image from "next/image";
import { showToast } from '@/lib/toast';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const languageContext = useLanguage();
  const language = languageContext?.language || 'en';
  const translations = languageContext?.translations || {};
  const t = translations[language] || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedEmail = email.toLowerCase().trim();

    if (isSignUp) {
      if (password !== confirmPassword) {
        showToast.error(t.passwordsDontMatch || "Passwords don't match");
        setLoading(false);
        return;
      }

      // Basic email validation
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError(t.invalidEmail || "Invalid email address format");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            email: trimmedEmail,
            password: password
          }),
        });

        const responseText = await response.text();
        let data;

        // Parse JSON only once
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          setError(t.networkError || 'Network error');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          setError(data.error || t.signupError || 'Signup failed');
          setLoading(false);
          return;
        }

        // Check for verification requirement
        if (data.requiresVerification) {
          setVerificationMode(true);
          setPendingUser({ email: trimmedEmail, password: password });
          setError(''); // Clear any errors
          setLoading(false);
          return;
        }

        // Continue with signin logic for non-verification flow
        const result = await signIn('credentials', {
          redirect: false,
          email: trimmedEmail,
          password: password
        });

        if (result?.error) {
          showToast.error(t.invalidCredentials || 'Invalid email or password');
          setError(''); // Clear any state error to avoid duplicates
        } else {
          showToast.success(t.signUpSuccess || 'Account created successfully!');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } catch (err) {
        console.error('Signup error:', err);
        setError(t.networkError || 'Network error');
      }
    } else {
      // Sign in
      const result = await signIn('credentials', {
        redirect: false,
        email: trimmedEmail,
        password: password
      });

      if (result.error) {
        showToast.error(t.invalidCredentials || 'Invalid email or password');
      } else {
        showToast.success(t.signInSuccess || 'Signed in successfully!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    }

    setLoading(false);
  };

  const toggleFormMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setVerificationMode(false);
    setVerificationCode('');
    setPendingUser(null);
  };

  const handleVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingUser.email,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Verification successful, now sign in
        const result = await signIn('credentials', {
          redirect: false,
          email: pendingUser.email,
          password: pendingUser.password
        });

        if (result.error) {
          showToast.success('Verification successful! Please sign in.');
        } else {
          showToast.success('Verification successful! Welcome to your dashboard.');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } else {
        showToast.error(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error during verification');
    }
    setLoading(false);
  };

  const handleBackToSignup = () => {
    setVerificationMode(false);
    setPendingUser(null);
    setVerificationCode('');
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

      <div className="flex-grow flex items-center justify-center">
        <div className="p-8 rounded-lg shadow-md w-full max-w-md bg-gray-100">
          <h2 className="text-black text-2xl font-bold mb-6 text-center">
            {verificationMode
              ? 'Verify Your Email'
              : isSignUp
                ? (t.signUp || 'Sign Up')
                : (t.signIn || 'Sign In')
            }
          </h2>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {verificationMode ? (
            <div>
              <div className="mb-4">
                <p className="text-black mb-4 text-center">
                  We sent a verification code to <strong>{pendingUser?.email}</strong>
                </p>
                <label className="block text-black mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="text-black w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter 6-digit code from email"
                  maxLength={6}
                />
              </div>
              <button
                type="button"
                onClick={handleVerification}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 mb-4"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
              <button
                type="button"
                onClick={handleBackToSignup}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-200"
              >
                Back to Sign Up
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-black mb-2" htmlFor="firstName">
                      {t.firstName || 'First Name'}
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="text-black w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-black mb-2" htmlFor="lastName">
                      {t.lastName || 'Last Name'}
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="text-black w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="email">
                  {t.email || 'Email'}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-black w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-black mb-2" htmlFor="password">
                  {t.password || 'Password'}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-black w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {isSignUp && (
                <div className="mb-6">
                  <label className="block text-black mb-2" htmlFor="confirmPassword">
                    {t.confirmPassword || 'Confirm Password'}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-black w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              {!isSignUp && (
                <div className="mb-6 text-right">
                  <button
                    type="button"
                    onClick={() => router.push('/auth/forgot-password')}
                    className="text-[#375171] hover:underline text-sm cursor-pointer"
                  >
                    {t.forgotPassword || 'Forgot Password?'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-[#D22E26] text-white py-2 px-4 rounded-lg hover:bg-[#2d4360] transition duration-200 cursor-pointer mb-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {loading ? (
                  t.loading || 'Processing...'
                ) : isSignUp ? (
                  t.signUp || 'Sign Up'
                ) : (
                  t.signIn || 'Sign In'
                )}
              </button>

              <div className="text-center text-gray-600 mt-4">
                <p className="mb-2">
                  {isSignUp
                    ? t.alreadyHaveAccount || 'Already have an account?'
                    : t.dontHaveAccount || "Don't have an account?"}
                </p>
                <button
                  type="button"
                  onClick={toggleFormMode}
                  className="text-[#375171] font-medium hover:underline cursor-pointer"
                >
                  {isSignUp ? t.signIn : t.signUp || 'Sign Up Now'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}