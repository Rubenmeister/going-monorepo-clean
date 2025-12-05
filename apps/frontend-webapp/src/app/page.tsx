'use client';
import { useState } from 'react';
import { DashboardLayout } from './layout/DashboardLayout';

const ModuleView = ({ title, color }: any) => (
  <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
    <div className={`w-24 h-24 rounded-full ${color} flex items-center justify-center text-4xl mb-6 shadow-xl`}>??</div>
    <h2 className="text-3xl font-black text-gray-800">{title}</h2>
    <p className="text-gray-500 mt-2">Módulo listo para desarrollo.</p>
  </div>
);

export default function HomePage() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard': return <ModuleView title="Resumen General" color="bg-blue-100 text-blue-600" />;
      case 'transport': return <ModuleView title="Transporte & Envíos" color="bg-red-100 text-red-600" />;
      case 'academy': return <ModuleView title="Going Academy" color="bg-indigo-100 text-indigo-600" />;
      default: return <ModuleView title={activeModule} color="bg-gray-100 text-gray-600" />;
    }
  };
  return <DashboardLayout activeModule={activeModule} setActiveModule={setActiveModule}>{renderContent()}</DashboardLayout>;
}
