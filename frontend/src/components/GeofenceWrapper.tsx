'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, ShieldAlert, Loader2 } from 'lucide-react';

// Coordenadas de la sucursal (Playa del Carmen)
const BRANCH_LAT = 20.671892;
const BRANCH_LON = -87.073463;
const ALLOWED_RADIUS_METERS = 150; // Margen de 150 metros

// Función Haversine para calcular distancia entre dos coordenadas en metros
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radio de la tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

interface GeofenceWrapperProps {
  children: React.ReactNode;
}

export default function GeofenceWrapper({ children }: GeofenceWrapperProps) {
  const [isWithinFence, setIsWithinFence] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    // Si el usuario es SUPER_ADMIN, omitir la verificación de geocerca
    const roleMatch = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    const role = roleMatch ? decodeURIComponent(roleMatch[2]) : null;
    
    if (role === 'SUPER_ADMIN') {
      setIsWithinFence(true);
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Tu dispositivo no soporta GPS. No puedes modificar el inventario desde aquí.');
      return;
    }

    const checkLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const currentDistance = getDistanceInMeters(userLat, userLon, BRANCH_LAT, BRANCH_LON);
          
          setDistance(Math.round(currentDistance));
          if (currentDistance <= ALLOWED_RADIUS_METERS) {
            setIsWithinFence(true);
            setError(null);
          } else {
            setIsWithinFence(false);
            setError(`Estás a ${Math.round(currentDistance)} metros de la sucursal. Se requieren ${ALLOWED_RADIUS_METERS} metros máximo.`);
          }
        },
        (err) => {
          setIsWithinFence(false);
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setError('Has denegado el permiso de ubicación. Por seguridad, no puedes acceder al inventario.');
              break;
            case err.POSITION_UNAVAILABLE:
              setError('La información de ubicación no está disponible en este momento.');
              break;
            case err.TIMEOUT:
              setError('La petición de ubicación ha tardado demasiado.');
              break;
            default:
              setError('Ocurrió un error desconocido al obtener tu ubicación.');
              break;
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    checkLocation();
    
    // Opcional: Re-verificar cada 2 minutos si el usuario se mueve
    const interval = setInterval(checkLocation, 120000);
    return () => clearInterval(interval);
  }, []);

  if (isWithinFence === null && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in duration-500">
        <Loader2 className="w-12 h-12 text-[#e07a5f] animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Verificando Seguridad GPS...</h2>
        <p className="text-gray-500 mt-2 max-w-md">
          Por favor, permite el acceso a tu ubicación en tu navegador para asegurar que estás dentro de la sucursal.
        </p>
      </div>
    );
  }

  if (isWithinFence === false || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-gray-50 rounded-3xl m-6 border border-gray-100 shadow-sm animate-in zoom-in-95 duration-300">
        <div className="bg-red-100 p-6 rounded-full mb-6">
          <ShieldAlert className="w-16 h-16 text-red-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-3 uppercase tracking-tight">Acceso Bloqueado por Geocerca</h2>
        <p className="text-gray-600 text-lg mb-6 max-w-lg font-medium leading-relaxed">
          {error}
        </p>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 text-left">
          <div className="bg-[#2c4c3b] p-3 rounded-lg text-white">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase">Ubicación Requerida</p>
            <p className="font-bold text-gray-800">C. Kaak, Tumben Chilam, Playa del Carmen</p>
          </div>
        </div>
        
        {distance && distance > ALLOWED_RADIUS_METERS && (
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 px-6 py-3 bg-[#e07a5f] hover:bg-[#d0694e] text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Reintentar Ubicación
          </button>
        )}
      </div>
    );
  }

  // Si está dentro del cerco, mostrar la pantalla original
  return <>{children}</>;
}
