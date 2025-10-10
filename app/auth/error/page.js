// app/auth/error/page.js
'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'Access was denied.',
    Verification: 'The verification link was invalid or has expired.',
    Default: 'An unexpected error occurred during authentication.',
  };

  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-700 mb-4">{errorMessage}</p>
        <button 
          onClick={() => window.location.href = '/auth/signin'}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
        >
          Return to Sign In
        </button>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-700 mb-4">Loading error details...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}