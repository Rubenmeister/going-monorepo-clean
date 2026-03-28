'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * /search — redirige transparentemente a /ride preservando todos los query params.
 * Permite que el formulario del home y cualquier enlace externo
 * con ?from=...&to=...&date=...&time=... aterrice correctamente.
 */
function SearchRedirect() {
  const params = useSearchParams();

  useEffect(() => {
    const qs = params.toString();
    window.location.replace(`/ride${qs ? '?' + qs : ''}`);
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Buscando disponibilidad…</p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchRedirect />
    </Suspense>
  );
}
