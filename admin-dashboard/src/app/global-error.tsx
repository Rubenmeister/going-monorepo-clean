'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-red-600">500</h1>
            <p className="text-xl text-gray-600 mt-4">Error del servidor</p>
            <button
              onClick={reset}
              className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-opacity-90"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
