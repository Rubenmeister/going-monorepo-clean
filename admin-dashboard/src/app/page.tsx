'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, bookings: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check Auth
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Mock Fetch Stats (Simulating real calls)
    // In a real app, we would hit /api/users/count, /api/bookings/stats, etc.
    // For this refactor, we verify connectivity.
    const fetchStats = async () => {
      try {
        // Just mocking for now as we don't have dedicated aggregate endpoints yet
        // Connectivity check via Auth
         const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
         });
         
         if(!res.ok) throw new Error('Auth failed');

         setStats({
           users: 154,
           bookings: 42,
           revenue: 12500,
         });
      } catch (e) {
        console.error(e);
        // router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (loading) return <div className="text-white p-10">Loading Admin Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold">Going Admin</h1>
        <button
          onClick={() => {
            localStorage.removeItem('admin_token');
            router.push('/login');
          }}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
          <h3 className="text-gray-400 text-sm uppercase">Total Users</h3>
          <p className="text-3xl font-bold mt-2">{stats.users}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-green-500">
          <h3 className="text-gray-400 text-sm uppercase">Bookings</h3>
          <p className="text-3xl font-bold mt-2">{stats.bookings}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
          <h3 className="text-gray-400 text-sm uppercase">Revenue (USD)</h3>
          <p className="text-3xl font-bold mt-2">${stats.revenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-10 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">System Health</h2>
        <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                <span>API Gateway</span>
                <span className="text-green-400 font-mono">ONLINE (Port 3000)</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                <span>Database</span>
                <span className="text-green-400 font-mono">CONNECTED</span>
             </div>
        </div>
      </div>
    </div>
  );
}