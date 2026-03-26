'use client';

import { useEffect } from 'react';
import { useRatingService } from '@/hooks/features/useRatingService';
import type { StarRating, CategoryRatings } from '@/types';
import { RATING_CATEGORIES, STAR_LABELS } from '@/types';

interface RatingFormProps {
  rideId?: string;
  driverId?: string;
  driverName?: string;
  onSubmit?: (rating: any) => void;
  onComplete?: () => void;
}

export function RatingForm({
  rideId = '',
  driverId = '',
  driverName = 'tu conductor',
  onSubmit,
  onComplete,
}: RatingFormProps) {
  const {
    overallRating,
    review,
    categories,
    loading,
    error,
    submitted,
    setOverallRating,
    setReview,
    setCategoryRating,
    submitRating,
  } = useRatingService();

  // ✅ Fix: usar useEffect para detectar cuando submitted cambia a true
  useEffect(() => {
    if (submitted) {
      onSubmit?.({ overallRating, review, categories });
      const t = setTimeout(() => onComplete?.(), 1500);
      return () => clearTimeout(t);
    }
  }, [submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRating(rideId, driverId);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center" data-testid="rating-confirmation">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
        <p className="text-xl font-black text-gray-900">¡Gracias por calificar!</p>
        <p className="text-sm text-gray-400 mt-1">Tu opinión nos ayuda a mejorar</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5"
      data-testid="rating-modal"
    >
      <div>
        <h3 className="text-xl font-black text-gray-900" data-testid="rating-title">
          Califica a {driverName}
        </h3>
        <p className="text-sm text-gray-400 mt-0.5">¿Cómo fue tu viaje?</p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl text-sm font-medium bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Estrellas globales */}
      <OverallRatingSection rating={overallRating} onRatingChange={setOverallRating} />

      {/* Categorías */}
      <CategoryRatingsSection categories={categories} onCategoryChange={setCategoryRating} />

      {/* Comentario */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
          Tu comentario <span className="font-normal normal-case">(opcional)</span>
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          maxLength={500}
          placeholder="Cuéntanos tu experiencia…"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0033A0] outline-none text-sm text-gray-800 resize-none"
          data-testid="review-text"
          rows={3}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{review.length}/500</p>
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={overallRating === 0 || loading}
        className="w-full py-4 rounded-2xl text-white font-black text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        style={{ background: overallRating === 0 ? '#9ca3af' : 'linear-gradient(135deg, #0033A0, #ff4c41)' }}
        data-testid="submit-rating-button"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Enviando…
          </span>
        ) : 'Enviar calificación →'}
      </button>
    </form>
  );
}

function OverallRatingSection({
  rating,
  onRatingChange,
}: {
  rating: StarRating | 0;
  onRatingChange: (rating: StarRating | 0) => void;
}) {
  return (
    <div>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star as StarRating)}
            className="text-4xl transition-transform hover:scale-110 active:scale-95"
            data-testid={`star-${star}`}
          >
            {star <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-center text-sm text-gray-500 mt-2 font-medium">
          {STAR_LABELS[rating as StarRating]}
        </p>
      )}
    </div>
  );
}

function CategoryRatingsSection({
  categories,
  onCategoryChange,
}: {
  categories: CategoryRatings;
  onCategoryChange: (category: keyof CategoryRatings, rating: StarRating | 0) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Califica por categoría</p>
      {(Object.entries(RATING_CATEGORIES) as Array<[keyof CategoryRatings, (typeof RATING_CATEGORIES)[keyof CategoryRatings]]>)
        .map(([category, config]) => (
          <div key={String(category)} className="flex items-center justify-between">
            <p className="text-sm text-gray-600 font-medium">
              {config.emoji} {config.name}
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => onCategoryChange(category, star as StarRating)}
                  className="text-xl transition-transform hover:scale-110"
                  data-testid={`category-${String(category)}-${star}`}
                >
                  {star <= categories[category] ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
