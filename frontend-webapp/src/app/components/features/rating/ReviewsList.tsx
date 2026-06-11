'use client';

import React, { useEffect, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.goingec.com';

interface Review {
  id: string;
  passengerName: string;
  rating: number;
  comment: string;
  route?: string;
  vehicleType?: string;
  createdAt: string;
}

/**
 * ReviewsList — Muestra las reseñas/valoraciones públicas de Going App.
 * Ideal para mostrar en la Home o página de rutas como testimonio social.
 */
export function ReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // El endpoint /reviews/public aún no está expuesto en el api-gateway.
      // Pre-lanzamiento NO mostramos reseñas de ejemplo: si no hay
      // valoraciones reales la sección se oculta sola (ver `return null` más
      // abajo) y aparecerá automáticamente cuando el backend las exponga.
      const res = await fetch(`${API_BASE}/reviews/public?limit=6`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.reviews ?? [];
      setReviews(list);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i <= count ? '#FFCD00' : '#E5E7EB'}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  // Sin reseñas reales todavía → no renderizamos la sección (pre-lanzamiento,
  // sin valoraciones inventadas). Aparecerá sola cuando haya reseñas reales.
  if (reviews.length === 0) return null;

  // Calcular promedio
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 5.0;

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">
            Lo que dicen nuestros pasajeros
          </h2>
          <div className="flex items-center justify-center gap-3 mb-2">
            {renderStars(Math.round(avgRating))}
            <span className="text-2xl font-black text-[#0033A0]">
              {avgRating.toFixed(1)}
            </span>
          </div>
          {reviews.length > 0 && (
            <p className="text-gray-500">
              {reviews.length} valoraciones verificadas
            </p>
          )}
        </div>

        {/* Reviews grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0033A0] flex items-center justify-center text-white font-bold text-sm">
                    {review.passengerName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {review.passengerName}
                    </p>
                    {review.route && (
                      <p className="text-xs text-gray-400">{review.route}</p>
                    )}
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                &ldquo;{review.comment}&rdquo;
              </p>

              <div className="flex items-center justify-between">
                {review.vehicleType && (
                  <span className="text-xs font-semibold text-[#0033A0] bg-[#0033A0]/5 px-2.5 py-1 rounded-full">
                    {review.vehicleType}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('es-EC', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
