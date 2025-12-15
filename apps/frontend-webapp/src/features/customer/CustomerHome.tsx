'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import {
  SearchFromTo,
  ServiceSwitcher,
  CapacityPicker,
  RegionChips,
  PopularRoutes,
  FeatureFlagGate,
  ServiceType,
  Location,
  EcuadorRegion,
  PopularRoute,
} from '@going/shared-ui';

export function CustomerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [serviceType, setServiceType] = useState<ServiceType>('private');
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [passengers, setPassengers] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<EcuadorRegion | null>(null);

  const handleContinue = () => {
    if (!fromLocation || !toLocation) return;
    
    const params = new URLSearchParams({
      from: fromLocation.id,
      to: toLocation.id,
      type: serviceType,
      ...(serviceType === 'shared' && { passengers: String(passengers) }),
    });
    
    if (serviceType === 'shipment') {
      navigate(`/c/shipment/new?${params.toString()}`);
    } else {
      navigate(`/c/ride/new?${params.toString()}`);
    }
  };

  const handlePopularRoute = (route: PopularRoute) => {
    // Pre-fill with popular route
    setFromLocation({ id: route.id + '-from', name: route.from, region: route.region });
    setToLocation({ id: route.id + '-to', name: route.to, region: route.region });
  };

  const isValid = fromLocation && toLocation;

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <span className="text-going-red">Going</span>
        </div>
        <div className="navbar-links hidden md:flex">
          <a href="/c/home" className="active">Inicio</a>
          <a href="/c/activity">Actividad</a>
          <a href="/c/payments">Pagos</a>
          <FeatureFlagGate flag="TOURS_ENABLED">
            <a href="/c/tours">Tours</a>
          </FeatureFlagGate>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/c/profile')}
            className="btn btn-outline"
          >
            {user?.name || 'Mi cuenta'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="hero-title">
            ¿A dónde <span className="text-going-red">vamos</span>?
          </h1>
          <p className="hero-subtitle mb-8">
            Viajes privados, compartidos y envíos en Ecuador
          </p>
        </div>
      </section>

      {/* Booking Card */}
      <div className="max-w-2xl mx-auto -mt-16 relative z-10 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          {/* Service Switcher */}
          <ServiceSwitcher
            value={serviceType}
            onChange={setServiceType}
            size="lg"
            className="mb-6"
          />

          {/* Search From → To */}
          <SearchFromTo
            fromValue={fromLocation}
            toValue={toLocation}
            onFromChange={setFromLocation}
            onToChange={setToLocation}
            className="mb-4"
          />

          {/* Capacity Picker (only for shared rides) */}
          {serviceType === 'shared' && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <CapacityPicker
                value={passengers}
                onChange={setPassengers}
                min={1}
                max={6}
                label="¿Cuántas personas viajan?"
              />
            </div>
          )}

          {/* Shipment note */}
          {serviceType === 'shipment' && (
            <div className="mb-4 p-4 bg-amber-50 rounded-xl text-amber-800 text-sm">
              📦 Los envíos tienen un peso máximo de 25kg y dimensiones de 50x50x50cm
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!isValid}
            className={`
              w-full py-4 rounded-xl font-semibold text-lg transition
              ${isValid
                ? 'bg-going-red text-white hover:bg-going-red-dark'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Continuar
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-2xl mx-auto mt-8 px-4">
        {/* Region Filter */}
        <div className="mb-6">
          <RegionChips
            value={selectedRegion}
            onChange={setSelectedRegion}
            showAll={true}
          />
        </div>

        {/* Popular Routes */}
        <PopularRoutes
          region={selectedRegion}
          onSelect={handlePopularRoute}
          limit={4}
        />
      </div>

      {/* Recent Activity */}
      <div className="max-w-2xl mx-auto mt-12 px-4 pb-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tu actividad reciente</h3>
        <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
          <span className="text-3xl mb-2 block">🚗</span>
          <p>Tus viajes recientes aparecerán aquí</p>
          <a href="/c/activity" className="text-going-red hover:underline text-sm mt-2 inline-block">
            Ver toda la actividad →
          </a>
        </div>
      </div>
    </div>
  );
}


