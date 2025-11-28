import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DriverLocation } from '@myorg/domains/tracking/core';

interface SeguimientoViajeProps {
  tripId: string;
}

const SeguimientoViaje = ({ tripId }: SeguimientoViajeProps) => {
  const [ubicacion, setUbicacion] = useState<DriverLocation | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('ws://localhost:3001'); // URL de tu tracking-service

    // Unirse a la sala del viaje
    newSocket.on('connect', () => {
      newSocket.emit('joinTrip', tripId);
    });

    // Escuchar actualizaciones de ubicación
    newSocket.on('locationUpdate', (location: DriverLocation) => {
      console.log('Nueva ubicación recibida:', location);
      setUbicacion(location);
    });

    setSocket(newSocket);

    // Limpiar al desmontar
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [tripId]);

  if (!ubicacion) {
    return <div>Cargando ubicación del conductor...</div>;
  }

  return (
    <div>
      <h3>Ubicación del conductor</h3>
      <p>Lat: {ubicacion.location.lat}</p>
      <p>Lng: {ubicacion.location.lng}</p>
      <p>Velocidad: {ubicacion.speed} km/h</p>
      {/* Aquí puedes integrar con un mapa como Leaflet o Google Maps */}
    </div>
  );
};

export default SeguimientoViaje;