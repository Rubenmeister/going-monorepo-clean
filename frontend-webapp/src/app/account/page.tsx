'use client';

import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

export default function AccountPage() {
  const { auth } = useMonorepoApp();

  if (!auth.user) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Account
            </h1>
            <p className="text-gray-600 mb-6">
              Please log in to view your account details
            </p>
            <button className="px-6 py-2 bg-going-primary text-white rounded-lg hover:bg-going-dark transition-colors">
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-going-primary mb-8">
          My Account
        </h1>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Profile Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <label className="text-gray-600 font-medium w-32">Name:</label>
              <p className="text-gray-800">{auth.user.firstName}</p>
            </div>
            <div className="flex items-center">
              <label className="text-gray-600 font-medium w-32">Email:</label>
              <p className="text-gray-800">{auth.user.email}</p>
            </div>
            <div className="flex items-center">
              <label className="text-gray-600 font-medium w-32">Roles:</label>
              <p className="text-gray-800">{auth.user.roles.join(', ')}</p>
            </div>
          </div>
          <button className="mt-6 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Edit Profile
          </button>
        </div>

        {/* Settings Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Account Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <span className="text-gray-700">Email Notifications</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <span className="text-gray-700">SMS Notifications</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-gray-700">Two-Factor Authentication</span>
              <input type="checkbox" className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm p-8 border border-red-200 bg-red-50">
          <h2 className="text-2xl font-bold text-going-danger mb-4">
            Danger Zone
          </h2>
          <p className="text-gray-600 mb-4">
            These actions are irreversible. Proceed with caution.
          </p>
          <button className="px-4 py-2 bg-going-danger text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
