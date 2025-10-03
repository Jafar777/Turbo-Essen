// app/dashboard/languages/page.js
'use client';
import { useSession } from 'next-auth/react';

export default function LanguagesPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Language Settings</h1>
        <p className="text-lg text-gray-600 mb-4">
          Manage language preferences, {session?.user?.firstName}!
        </p>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Language Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Change interface language</li>
            <li>Add multiple languages</li>
            <li>Translation management</li>
            <li>Locale settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}