'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Trip Complete + Rating ──────────────────────────────────────────────────
// Pantalla de fin de viaje con:
//   - Resumen del viaje (ruta, tiempo, km, CO₂ ahorrado)
//   - Going Rewards ganados
//   - Rating binario 👍/👎 + estrellas + comentario
//   - CTA "Agendar Regreso"
// ────────────────────────────────────────────────────────────────────────────

const REWARDS_EARNED = 85;
const TOTAL_REWARDS = 2535;

export default function TripCompletePage() {
  const router = useRouter();
  const [thumbRating, setThumbRating] = useState<'up' | 'down' | null>(null);
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showRewardAnim, setShowRewardAnim] = useState(false);

  const handleSubmit = () => {
    if (!thumbRating && stars === 0) return;
    setShowRewardAnim(true);
    setTimeout(() => {
      setSubmitted(true);
    }, 1800);
  };

  if (submitted) {
    return <ThankYouScreen router={router} />;
  }

  return (
    <div className="min-h-screen bg-[#080a0e] text-white flex flex-col overflow-y-auto">
      {/* Confetti-like header */}
      <div className="relative bg-gradient-to-b from-[#011627] to-[#080a0e] pt-16 pb-8 px-5 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none">
          {['🎉', '⭐', '🚗', '✨', '🎊'].map((e, i) => (
            <span
              key={i}
              className="absolute text-2xl opacity-20 animate-bounce"
              style={{ left: `${10 + i * 20}%`, top: `${15 + (i % 3) * 20}%`, animationDelay: `${i * 0.3}s` }}
            >
              {e}
            </span>
          ))}
        </div>
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-[26px] font-black text-white mb-1">¡Llegaste!</h1>
          <p className="text-[14px] text-white/40">Gracias por viajar con Going, Ruben</p>
        </div>
      </div>

      <div className="px-5 pb-10">
        {/* Trip Summary */}
        <div className="bg-[#0d1117] border border-white/8 rounded-3xl p-5 mb-4">
          <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-4">Resumen del viaje</div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 text-center">
              <div className="text-[13px] text-white/40 font-bold">Salida</div>
              <div className="text-[14px] font-black text-white mt-0.5">Quitumbe</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-[#ff4c41] text-lg">→</div>
              <div className="text-[10px] text-white/30">3h 24min</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-[13px] text-white/40 font-bold">Llegada</div>
              <div className="text-[14px] font-black text-white mt-0.5">Baños</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon="📍" value="182 km" label="Distancia" />
            <StatCard icon="⏱️" value="3h 24m" label="Duración" />
            <StatCard icon="🌱" value="12.4 kg" label="CO₂ ahorrado" green />
          </div>
        </div>

        {/* Going Rewards earned */}
        <div className={`bg-[#0d1117] border rounded-3xl p-5 mb-4 overflow-hidden relative transition-all duration-500 ${
          showRewardAnim ? 'border-[#ff4c41]/40 shadow-lg shadow-red-900/20' : 'border-white/8'
        }`}>
          {showRewardAnim && (
            <div className="absolute inset-0 bg-[#ff4c41]/5 animate-pulse" />
          )}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase">Going Rewards</div>
              <div className="px-2.5 py-1 rounded-full bg-[#ff4c41]/15 border border-[#ff4c41]/20">
                <span className="text-[11px] text-[#ff4c41] font-black">Nivel Gold</span>
              </div>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <div>
                <div className="text-[36px] font-black text-[#ff4c41] leading-none">+{REWARDS_EARNED}</div>
                <div className="text-[12px] text-white/40 font-bold mt-0.5">puntos ganados</div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-[14px] font-black text-white">{TOTAL_REWARDS.toLocaleString()}</div>
                <div className="text-[11px] text-white/30">puntos totales</div>
              </div>
            </div>
            {/* Progress bar to next level */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px] text-white/30">Explorador Sierra Nv.4</span>
                <span className="text-[11px] text-white/30">3,000 → Platino</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff4c41] to-[#ff8c41] rounded-full transition-all duration-1000"
                  style={{ width: `${(TOTAL_REWARDS / 3000) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-white/25 mt-1">{3000 - TOTAL_REWARDS} puntos para Platino</div>
            </div>
          </div>
        </div>

        {/* CO₂ impact card */}
        <div className="bg-green-900/10 border border-green-500/15 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="text-3xl">🌳</div>
          <div>
            <div className="text-[14px] font-black text-green-400">Contribuiste al planeta</div>
            <div className="text-[12px] text-green-400/60 leading-relaxed">
              Viajando compartido ahorraste 12.4 kg de CO₂ vs ir en auto propio.
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-[#0d1117] border border-white/8 rounded-3xl p-5 mb-4">
          <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-4">¿Cómo estuvo tu viaje?</div>

          {/* Driver info */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff4c41] to-[#011627] flex items-center justify-center">
              <span className="text-xl">👨</span>
            </div>
            <div>
              <div className="text-[15px] font-black text-white">Carlos Mendoza</div>
              <div className="text-[12px] text-white/40">847 viajes · 4.92 ★ promedio</div>
            </div>
          </div>

          {/* Thumb rating */}
          <div className="flex gap-3 mb-5">
            <ThumbButton
              icon="👍"
              label="Excelente"
              active={thumbRating === 'up'}
              color="green"
              onClick={() => setThumbRating('up')}
            />
            <ThumbButton
              icon="👎"
              label="Mejorable"
              active={thumbRating === 'down'}
              color="red"
              onClick={() => setThumbRating('down')}
            />
          </div>

          {/* Stars */}
          <div className="flex gap-2 justify-center mb-5">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onMouseEnter={() => setHoveredStar(n)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setStars(n)}
                className="text-[34px] transition-transform active:scale-110"
              >
                <span className={n <= (hoveredStar || stars) ? 'text-yellow-400' : 'text-white/10'}>★</span>
              </button>
            ))}
          </div>
          {stars > 0 && (
            <p className="text-center text-[12px] text-white/40 -mt-3 mb-4">
              {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][stars]}
            </p>
          )}

          {/* Optional comment */}
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Deja un comentario opcional..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white placeholder-white/20 resize-none focus:outline-none focus:border-[#ff4c41]/40 transition-colors"
            rows={3}
          />
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={!thumbRating && stars === 0}
            className={`w-full py-4 rounded-2xl font-black text-[16px] transition-all active:scale-98 ${
              thumbRating || stars > 0
                ? 'bg-[#ff4c41] text-white shadow-lg shadow-red-900/40'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            Enviar calificación →
          </button>

          <button
            onClick={() => router.push('/transport')}
            className="w-full py-4 rounded-2xl font-black text-[15px] bg-[#011627] text-white border border-white/10 active:scale-98 transition-all"
          >
            🔄 Agendar regreso a Quito
          </button>

          <button
            onClick={() => router.push('/home')}
            className="w-full py-3 rounded-2xl font-bold text-[14px] text-white/30 active:scale-98 transition-all"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, value, label, green }: { icon: string; value: string; label: string; green?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 text-center border ${green ? 'bg-green-900/10 border-green-500/15' : 'bg-white/4 border-white/6'}`}>
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-[15px] font-black ${green ? 'text-green-400' : 'text-white'}`}>{value}</div>
      <div className={`text-[10px] font-bold ${green ? 'text-green-400/50' : 'text-white/30'}`}>{label}</div>
    </div>
  );
}

function ThumbButton({
  icon, label, active, color, onClick,
}: {
  icon: string; label: string; active: boolean; color: 'green' | 'red'; onClick: () => void;
}) {
  const colors = {
    green: active ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-white/40',
    red: active ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-white/40',
  };
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all active:scale-95 ${colors[color]}`}
    >
      <span className="text-[28px]">{icon}</span>
      <span className="text-[12px] font-black">{label}</span>
    </button>
  );
}

function ThankYouScreen({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="min-h-screen bg-[#080a0e] flex flex-col items-center justify-center px-5 text-center">
      <div className="w-24 h-24 rounded-full bg-[#ff4c41]/15 border border-[#ff4c41]/20 flex items-center justify-center mb-6 animate-pulse">
        <span className="text-5xl">🙏</span>
      </div>
      <h2 className="text-[28px] font-black text-white mb-2">¡Gracias!</h2>
      <p className="text-[14px] text-white/40 max-w-xs mb-2">
        Tu calificación ayuda a mantener la calidad de nuestra comunidad.
      </p>
      <div className="px-4 py-2 rounded-full bg-[#ff4c41]/15 border border-[#ff4c41]/20 mb-8">
        <span className="text-[13px] text-[#ff4c41] font-black">+85 Going Rewards acreditados</span>
      </div>
      <button
        onClick={() => router.push('/home')}
        className="w-full max-w-xs py-4 rounded-2xl bg-[#ff4c41] text-white font-black text-[16px]"
      >
        Volver al inicio
      </button>
    </div>
  );
}
