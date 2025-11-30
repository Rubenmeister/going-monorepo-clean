'use client';
import { useState } from 'react';
import { DashboardLayout } from './layout/DashboardLayout';

// Componentes "Placeholder" para cada servicio (Para que veas el cambio)
const ModuleView = ({ title, desc, color }: any) => (
  <div className="h-full w-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
    <div className={`w-24 h-24 rounded-full ${color} flex items-center justify-center text-4xl mb-6 shadow-xl`}>
      ??
    </div>
    <h2 className="text-3xl font-black text-gray-800 mb-2">{title}</h2>
    <p className="text-gray-500 max-w-md">{desc}</p>
    <button className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
      Explorar Servicio
    </button>
  </div>
);

export default function HomePage() {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard': return <ModuleView title="Dashboard General" desc="Resumen de tus viajes, ganancias y estadísticas." color="bg-blue-100 text-blue-600" />;
      case 'transport': return <ModuleView title="Transporte" desc="Solicita un SUV, VAN o envía paquetería." color="bg-red-100 text-red-600" />;
      case 'accommodation': return <ModuleView title="Alojamiento" desc="Hoteles, Hostales y Glamping." color="bg-green-100 text-green-600" />;
      case 'tours': return <ModuleView title="Tours & Viajes" desc="Paquetes turísticos y experiencias locales." color="bg-yellow-100 text-yellow-600" />;
      case 'activities': return <ModuleView title="Actividades Locales" desc="Eventos, museos y gastronomía." color="bg-purple-100 text-purple-600" />;
      case 'academy': return <ModuleView title="Going Academy" desc="Cursos para conductores y anfitriones." color="bg-indigo-100 text-indigo-600" />;
      case 'wallet': return <ModuleView title="Billetera" desc="Gestiona tus pagos y métodos de cobro." color="bg-emerald-100 text-emerald-600" />;
      case 'tracking': return <ModuleView title="Seguimiento en Tiempo Real" desc="Ubicación de unidades y seres queridos." color="bg-orange-100 text-orange-600" />;
      case 'profile': return <ModuleView title="Perfil de Usuario" desc="Configuración, seguridad y documentos." color="bg-gray-200 text-gray-600" />;
      default: return <div>Módulo no encontrado</div>;
    }
  };

  return (
    <DashboardLayout activeModule={activeModule} setActiveModule={setActiveModule}>
      {renderContent()}
    </DashboardLayout>
  );
}
