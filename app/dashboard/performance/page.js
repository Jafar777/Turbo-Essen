// app/dashboard/performance/page.js
'use client';
import { useSession } from 'next-auth/react';

export default function PerformancePage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Performance Analytics</h1>
        <p className="text-lg text-gray-600 mb-4">
          View your performance metrics, {session?.user?.firstName}!
        </p>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Sales performance</li>
            <li>User engagement</li>
            <li>Revenue analytics</li>
            <li>Growth metrics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}