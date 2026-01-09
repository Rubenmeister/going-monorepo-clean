import React, { useEffect, useState } from 'react';
import { Card, Button } from '../../components/ui';
import { Badge } from '@going/shared-ui';
import { useAuth } from '../../contexts';
import { apiClient } from '../../lib/api';
import { Link } from 'react-router-dom';

export type ActivityType = 'experience' | 'transport' | 'parcel' | 'accommodation';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'published';
  from: string;
  to: string;
  date: string;
  time?: string;
  amount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  currency?: string;
}

// Interfaces for API responses
interface ExperienceDto { id: string; status: any; location: string; createdAt: string; durationHours: number; pricePerPerson: number; }
interface TransportDto { id: string; status: string; originAddress: string; originCity: string; destAddress: string; destCity: string; departureTime: string; pricePerPassenger: number; }
interface ParcelDto { id: string; status: string; originAddress: string; destinationAddress: string; createdAt: string; price: number; currency: string; }
interface AccommodationDto { id: string; city: string; title: string; price: number; currency: string; }

export function ActivityList() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const userId = user?.id;
        
        // Define requests for all 4 domains
        const requestPromises = [
          // 1. Experiences (Existing)
          apiClient.get<ExperienceDto[]>('/api/experiences/experiences')
            .then(res => ({ status: 'fulfilled' as const, type: 'experience', value: res.data }))
            .catch(err => ({ status: 'rejected' as const, type: 'experience', reason: err })),
            
          // 2. Transports/Rides (Existing)
          apiClient.get<TransportDto[]>('/api/transports') 
            .then(res => ({ status: 'fulfilled' as const, type: 'transport', value: res.data }))
            .catch(err => ({ status: 'rejected' as const, type: 'transport', reason: err })),

          // 3. Parcels (New)
          apiClient.get<ParcelDto[]>(userId ? `/api/parcels/user/${userId}` : '/api/parcels') 
            .then(res => ({ status: 'fulfilled' as const, type: 'parcel', value: res.data }))
            .catch(err => ({ status: 'rejected' as const, type: 'parcel', reason: err })),

          // 4. Accommodations (New)
          apiClient.get<AccommodationDto[]>('/api/hosts/search') 
            .then(res => ({ status: 'fulfilled' as const, type: 'accommodation', value: res.data }))
            .catch(err => ({ status: 'rejected' as const, type: 'accommodation', reason: err }))
        ];

        const results = await Promise.all(requestPromises);
        const newActivities: ActivityItem[] = [];

        results.forEach(result => {
          if (result.status === 'rejected') {
            console.warn(`Failed to fetch ${result.type}:`, result.reason);
            return;
          }

          const data = Array.isArray(result.value) ? result.value : [];

          switch (result.type) {
            case 'experience':
              newActivities.push(...(data as ExperienceDto[]).map((exp) => ({
                id: exp.id,
                type: 'experience' as const,
                status: exp.status as ActivityItem['status'],
                from: exp.location,
                to: 'Experiencia Local',
                date: new Date(exp.createdAt).toLocaleDateString(),
                time: `${exp.durationHours}h`,
                amount: exp.pricePerPerson,
                paymentStatus: 'completed' as const,
              })));
              break;

            case 'transport':
              newActivities.push(...(data as TransportDto[]).map((trip) => ({
                id: trip.id,
                type: 'transport' as const,
                status: (trip.status || 'published') as ActivityItem['status'],
                from: trip.originAddress || trip.originCity,
                to: trip.destAddress || trip.destCity,
                date: new Date(trip.departureTime).toLocaleDateString(),
                time: new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                amount: trip.pricePerPassenger,
                paymentStatus: 'pending' as const,
              })));
              break;

            case 'parcel':
              newActivities.push(...(data as ParcelDto[]).map((pkg) => ({
                id: pkg.id,
                type: 'parcel' as const,
                status: pkg.status as ActivityItem['status'],
                from: pkg.originAddress,
                to: pkg.destinationAddress,
                date: new Date(pkg.createdAt).toLocaleDateString(),
                time: 'Entregas 24h',
                amount: pkg.price,
                paymentStatus: 'completed' as const, 
                currency: pkg.currency
              })));
              break;

            case 'accommodation':
              newActivities.push(...(data as AccommodationDto[]).map((acc) => ({
                id: acc.id,
                type: 'accommodation' as const,
                status: 'published' as const, 
                from: acc.city,
                to: acc.title,
                date: 'Disponible',
                amount: acc.price,
                paymentStatus: 'pending' as const,
                currency: acc.currency
              })));
              break;
          }
        });

        setActivities(newActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setError(null);

      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('No se pudieron cargar algunas actividades.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchActivities();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-lg font-bold text-gray-900">Sin actividad reciente</h3>
        <p className="text-gray-500 max-w-xs mx-auto mt-2">
          Tus viajes, envíos y reservas aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Actividad</h1>
            <Button variant="ghost" size="sm" className="text-brand-red">
               <Link to="/c/home">Nuevo viaje</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {activities.map((item) => (
          <Card key={item.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white border border-gray-100/50 group mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl
                  ${item.type === 'experience' ? 'bg-orange-100 text-orange-600' : ''}
                  ${item.type === 'transport' ? 'bg-blue-100 text-blue-600' : ''}
                  ${item.type === 'parcel' ? 'bg-yellow-100 text-yellow-600' : ''}
                  ${item.type === 'accommodation' ? 'bg-purple-100 text-purple-600' : ''}
                `}>
                  {item.type === 'experience' && '✨'}
                  {item.type === 'transport' && '🚗'}
                  {item.type === 'parcel' && '📦'}
                  {item.type === 'accommodation' && '🏠'}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{item.to}</span>
                    <Badge variant={
                      item.status === 'completed' ? 'secondary' : 
                      item.status === 'confirmed' ? 'default' : 'secondary'
                    } className="text-[10px] uppercase">
                      {item.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span>{item.from}</span>
                    <span>•</span>
                    <span>{item.date}</span>
                    {item.time && (
                      <>
                        <span>•</span>
                        <span>{item.time}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {item.currency || '$'}{item.amount}
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {item.paymentStatus === 'completed' ? 'Pagado' : 'Pendiente'}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
