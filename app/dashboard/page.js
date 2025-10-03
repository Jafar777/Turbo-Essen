// app/dashboard/page.js
'use client';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const { data: session } = useSession();


  return (
    <div className="max-w-6xl mx-auto">


      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to your Dashboard, {session?.user?.name}!
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Email: {session?.user?.email}
        </p>
        <p className="text-lg text-gray-600 mb-4">
          Welcome back, {session?.user?.firstName}!
        </p>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Dashboard Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Account Management</li>
            <li>Profile Settings</li>
            <li>Restaurant Management</li>
            <li>Order Tracking</li>
            <li>Performance Analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}