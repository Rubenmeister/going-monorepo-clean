'use client';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

export default function HomePage() {
  const { user, isAuthenticated, login, logout } = useMonorepoApp();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
        <h1 className="text-4xl font-black text-red-500 mb-2">Going</h1>
        <p className="text-gray-500 mb-6">Plataforma Logística & Ride-Hailing</p>
        
        {isAuthenticated ? (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="font-bold text-green-800">Hola, {user?.fullName || user?.email}</p>
            <button onClick={logout} className="mt-4 text-sm text-gray-500 underline hover:text-gray-700">Cerrar Sesión</button>
          </div>
        ) : (
          <button 
            onClick={() => login('fake-jwt-token')}
            className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
          >
            Iniciar Demo
          </button>
        )}
      </div>
      <p className="mt-8 text-xs text-gray-400">Estado: Producción Lista 🚀</p>
    </div>
  );
}