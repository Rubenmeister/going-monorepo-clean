'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">Error</h1>
        <p className="text-xl text-gray-600 mt-4">Algo salió mal</p>
        <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 inline-block px-6 py-2 bg-[#0033A0] text-white rounded-md hover:bg-opacity-90"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
