'use client';

import { useState, useEffect } from 'react';

interface TransportKPIs {
  fleetUtilization: number;
  costPerKm: number;
  tripsCompletedToday: {
    suv: number;
    van: number;
    minibus: number;
    bus: number;
  };
  cancellationRate: number;
  activeDrivers: number;
  totalVehicles: number;
  revenueToday: number;
}

// Mock data - replace with real API
const MOCK_KPIS: TransportKPIs = {
  fleetUtilization: 78,
  costPerKm: 0.42,
  tripsCompletedToday: { suv: 87, van: 23, minibus: 12, bus: 5 },
  cancellationRate: 3.2,
  activeDrivers: 45,
  totalVehicles: 100,
  revenueToday: 2340,
};

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  target: string;
  status: 'good' | 'warning' | 'critical';
  trend?: { value: number; direction: 'up' | 'down' };
}

function KPICard({ label, value, unit, target, status, trend }: KPICardProps) {
  const statusColors = {
    good: 'border-success bg-success/5',
    warning: 'border-going-yellow bg-going-yellow/5',
    critical: 'border-error bg-error/5',
  };

  const statusDot = {
    good: 'bg-success shadow-[0_0_8px_var(--status-success)]',
    warning: 'bg-going-yellow shadow-[0_0_8px_var(--going-yellow)]',
    critical: 'bg-error shadow-[0_0_8px_var(--status-error)]',
  };

  return (
    <div className={`rounded-lg p-4 border-l-4 bg-surface ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
        <div className={`w-2 h-2 rounded-full ${statusDot[status]}`} />
      </div>
      <p className="text-3xl font-bold text-white">
        {value}
        {unit && <span className="text-lg font-normal text-white/60 ml-1">{unit}</span>}
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-white/40">Meta: {target}</span>
        {trend && (
          <span className={`text-xs ${trend.direction === 'up' ? 'text-success' : 'text-error'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}

interface VehicleTypeRowProps {
  type: string;
  trips: number;
  target: number;
  icon: string;
  isAuthorized?: boolean;
}

function VehicleTypeRow({ type, trips, target, icon, isAuthorized }: VehicleTypeRowProps) {
  const progress = Math.min((trips / target) * 100, 100);
  const isOnTrack = progress >= 80;

  return (
    <div className="flex items-center gap-4 p-3 bg-charcoal rounded-lg">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white font-medium">{type}</span>
          <div className="flex items-center gap-2">
            {isAuthorized !== undefined && (
              <span className={`text-[10px] px-2 py-0.5 rounded ${
                isAuthorized 
                  ? 'bg-success/20 text-success' 
                  : 'bg-white/10 text-white/50'
              }`}>
                {isAuthorized ? '✓ ANT' : 'GRIS'}
              </span>
            )}
            <span className="text-sm text-white/60">{trips}/{target}</span>
          </div>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${isOnTrack ? 'bg-success' : 'bg-going-yellow'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function KPITransportPanel() {
  const [kpis, setKpis] = useState<TransportKPIs>(MOCK_KPIS);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setKpis(prev => ({
        ...prev,
        fleetUtilization: Math.min(100, prev.fleetUtilization + (Math.random() - 0.5) * 2),
        tripsCompletedToday: {
          ...prev.tripsCompletedToday,
          suv: prev.tripsCompletedToday.suv + (Math.random() > 0.7 ? 1 : 0),
        },
        revenueToday: prev.revenueToday + Math.floor(Math.random() * 20),
      }));
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getFleetStatus = (util: number) => util >= 80 ? 'good' : util >= 60 ? 'warning' : 'critical';
  const getCPKStatus = (cpk: number) => cpk <= 0.50 ? 'good' : cpk <= 0.65 ? 'warning' : 'critical';
  const getCancelStatus = (rate: number) => rate <= 5 ? 'good' : rate <= 8 ? 'warning' : 'critical';

  const totalTrips = Object.values(kpis.tripsCompletedToday).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-bold text-white">KPIs Transporte Central</h3>
          <p className="text-xs text-white/40">Última actualización: {lastUpdate.toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          En vivo
        </div>
      </div>

      {/* Main KPIs Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          label="Utilización Flota"
          value={Math.round(kpis.fleetUtilization)}
          unit="%"
          target=">80%"
          status={getFleetStatus(kpis.fleetUtilization)}
          trend={{ value: 2.3, direction: 'up' }}
        />
        <KPICard
          label="Coste por Km"
          value={`$${kpis.costPerKm.toFixed(2)}`}
          target="<$0.50"
          status={getCPKStatus(kpis.costPerKm)}
          trend={{ value: 5.1, direction: 'down' }}
        />
        <KPICard
          label="Cancelaciones"
          value={kpis.cancellationRate.toFixed(1)}
          unit="%"
          target="<5%"
          status={getCancelStatus(kpis.cancellationRate)}
        />
        <KPICard
          label="Revenue Hoy"
          value={`$${kpis.revenueToday.toLocaleString()}`}
          target="$2,000+"
          status={kpis.revenueToday >= 2000 ? 'good' : 'warning'}
          trend={{ value: 12.5, direction: 'up' }}
        />
      </div>

      {/* Trips by Vehicle Type */}
      <div className="bg-surface rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-white">Viajes Completados Hoy</h4>
          <span className="text-2xl font-bold text-going-red">{totalTrips}</span>
        </div>
        <div className="space-y-2">
          <VehicleTypeRow 
            type="SUV Compartido" 
            trips={kpis.tripsCompletedToday.suv} 
            target={100} 
            icon="🚙"
            isAuthorized={false}
          />
          <VehicleTypeRow 
            type="VAN Turística" 
            trips={kpis.tripsCompletedToday.van} 
            target={30} 
            icon="🚐"
            isAuthorized={true}
          />
          <VehicleTypeRow 
            type="Minibus" 
            trips={kpis.tripsCompletedToday.minibus} 
            target={15} 
            icon="🚌"
            isAuthorized={true}
          />
          <VehicleTypeRow 
            type="Bus 50pax" 
            trips={kpis.tripsCompletedToday.bus} 
            target={8} 
            icon="🚍"
            isAuthorized={true}
          />
        </div>
      </div>

      {/* Fleet Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-lg p-4 border border-border">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Conductores Activos</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{kpis.activeDrivers}</span>
            <span className="text-white/40 pb-1">/ {kpis.totalVehicles} vehículos</span>
          </div>
          <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-going-red rounded-full"
              style={{ width: `${(kpis.activeDrivers / kpis.totalVehicles) * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Meta Diaria</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold text-white">$20</span>
              <span className="text-white/40 ml-1">/trip</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-success">$2,540</p>
              <p className="text-xs text-white/40">Proyectado hoy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
