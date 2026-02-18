'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

// Mock data for purchases and receipts
const mockPurchases = [
  {
    id: 1,
    title: 'Vuelo a Quito - Llegada al Paraíso',
    type: 'Transporte',
    date: '2026-02-15',
    price: 125.50,
    status: 'completado',
    bookingRef: 'GOING-001-2026',
  },
  {
    id: 2,
    title: 'Hotel Amazonia Lodge',
    type: 'Alojamiento',
    date: '2026-02-10',
    price: 450.00,
    status: 'completado',
    bookingRef: 'GOING-002-2026',
  },
  {
    id: 3,
    title: 'Tour Aventura en Cotopaxi',
    type: 'Experiencia',
    date: '2026-01-28',
    price: 89.99,
    status: 'completado',
    bookingRef: 'GOING-003-2026',
  },
  {
    id: 4,
    title: 'Transporte Local Cuenca',
    type: 'Transporte',
    date: '2026-01-15',
    price: 22.50,
    status: 'completado',
    bookingRef: 'GOING-004-2026',
  },
  {
    id: 5,
    title: 'Galapagos Cruise Premium',
    type: 'Experiencia',
    date: '2026-01-05',
    price: 1299.00,
    status: 'completado',
    bookingRef: 'GOING-005-2026',
  },
];

export default function AccountPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedPurchase, setSelectedPurchase] = useState<number | null>(null);

  if (!auth.user) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Acceso Requerido
            </h1>
            <p className="text-gray-600 mb-6">
              Por favor inicia sesión para ver los detalles de tu cuenta
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            👤 Mi Cuenta
          </h1>
          <p className="text-gray-600">Gestiona tu perfil, reservas y pagos</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 bg-white rounded-t-lg p-4">
          {[
            { id: 'profile', label: '👤 Perfil', icon: '👤' },
            { id: 'purchases', label: '🛍️ Mis Compras', icon: '🛍️' },
            { id: 'receipts', label: '📄 Recibos', icon: '📄' },
            { id: 'settings', label: '⚙️ Configuración', icon: '⚙️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold transition-all text-sm md:text-base ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Información del Perfil
              </h2>

              <div className="flex items-start gap-6 mb-8">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl">
                  {auth.user.firstName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="text-lg font-semibold text-gray-900 mb-4">
                    {auth.user.firstName}
                  </p>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {auth.user.email}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm text-gray-600">Nombre</label>
                  <input
                    type="text"
                    value={auth.user.firstName}
                    disabled
                    className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <input
                    type="email"
                    value={auth.user.email}
                    disabled
                    className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900"
                  />
                </div>
              </div>

              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Editar Perfil
              </button>
            </div>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Historial de Compras</h2>
                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                  {mockPurchases.length} compras
                </span>
              </div>

              <div className="space-y-3">
                {mockPurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedPurchase(purchase.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">
                            {purchase.type === 'Transporte'
                              ? '✈️'
                              : purchase.type === 'Alojamiento'
                              ? '🏨'
                              : '🎭'}
                          </span>
                          <p className="font-semibold text-gray-900">
                            {purchase.title}
                          </p>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>Ref: {purchase.bookingRef}</span>
                          <span>{new Date(purchase.date).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          ${purchase.price.toFixed(2)}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                            purchase.status === 'completado'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          ✓ {purchase.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Receipts Tab */}
        {activeTab === 'receipts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Mis Recibos</h2>

              <div className="grid md:grid-cols-2 gap-4">
                {mockPurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          Ref: {purchase.bookingRef}
                        </p>
                        <p className="font-bold text-gray-900">{purchase.title}</p>
                      </div>
                      <span className="text-2xl">📄</span>
                    </div>
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600">
                        {new Date(purchase.date).toLocaleDateString('es-ES')}
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        ${purchase.price.toFixed(2)}
                      </p>
                    </div>
                    <button className="w-full px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors font-semibold text-sm flex items-center justify-center gap-2">
                      <span>📥</span>
                      Descargar PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Notificaciones
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Notificaciones por Email', enabled: true },
                  { label: 'Notificaciones por SMS', enabled: true },
                  { label: 'Ofertas y Promociones', enabled: false },
                  { label: 'Actualizaciones de Reservas', enabled: true },
                ].map((setting, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
                  >
                    <span className="text-gray-700 font-medium">{setting.label}</span>
                    <input
                      type="checkbox"
                      defaultChecked={setting.enabled}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Seguridad
              </h2>
              <div className="space-y-4">
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-between">
                  <span>Cambiar Contraseña</span>
                  <span>→</span>
                </button>
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-between">
                  <span>Autenticación de Dos Factores</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-xl shadow-md p-8 border border-red-200">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                ⚠️ Zona de Peligro
              </h2>
              <p className="text-gray-700 mb-4">
                Estas acciones son irreversibles. Por favor, procede con cuidado.
              </p>
              <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
                Eliminar Cuenta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
