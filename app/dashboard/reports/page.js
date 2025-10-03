// app/dashboard/reports/page.js
'use client';
import { useSession } from 'next-auth/react';

export default function ReportsPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Reports & Analytics</h1>
        <p className="text-lg text-gray-600 mb-4">
          Access detailed reports, {session?.user?.firstName}!
        </p>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Report Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Generate custom reports</li>
            <li>Export data</li>
            <li>View analytics dashboards</li>
            <li>Schedule automated reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
}