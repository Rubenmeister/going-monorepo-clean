'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Going Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl mb-4">⚠️</p>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Algo salió mal</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-xs">
        Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl font-bold text-white text-sm shadow-sm hover:shadow-md transition-all"
          style={{ backgroundColor: '#ff4c41' }}
        >
          Intentar de nuevo
        </button>
        <a
          href="/"
          className="px-5 py-2.5 rounded-xl font-bold text-gray-700 text-sm bg-white border border-gray-200 hover:border-gray-300 transition-all"
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
