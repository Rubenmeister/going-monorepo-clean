'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STEPS = [
  {
    id: 'welcome',
    icon: '👋',
    title: 'Bienvenido a Going',
    subtitle: 'Ecuador en un solo app',
    desc: 'Viajes, hospedaje, tours, experiencias y envíos — todo en un lugar pensado para que explores tu país.',
    color: '#ff4c41',
    bg: '#fff2f2',
  },
  {
    id: 'ride',
    icon: '🚗',
    title: 'Pide tu viaje',
    subtitle: 'Privado o compartido',
    desc: 'Elige entre transporte privado con SUV, VAN o BUS, o comparte el viaje con otros pasajeros para pagar menos.',
    color: '#0033A0',
    bg: '#eff6ff',
    feature: [
      { icon: '🔒', text: 'Verificación de conductor en cada viaje' },
      { icon: '📍', text: 'Seguimiento en tiempo real' },
      { icon: '💬', text: 'Chat directo con tu conductor' },
    ],
  },
  {
    id: 'services',
    icon: '🌍',
    title: 'Descubre Ecuador',
    subtitle: 'Más allá del transporte',
    desc: 'Hospedaje, tours a Galápagos, experiencias culturales, envíos express — Going conecta todo el país.',
    color: '#10b981',
    bg: '#ecfdf5',
    feature: [
      { icon: '🏨', text: 'Hospedaje desde $35/noche' },
      { icon: '🗺️', text: 'Tours a los 4 mundos de Ecuador' },
      { icon: '📦', text: 'Envíos express el mismo día' },
    ],
  },
  {
    id: 'safety',
    icon: '🛡️',
    title: 'Tu seguridad primero',
    subtitle: 'Siempre protegido',
    desc: 'Cada viaje tiene verificación de identidad, número proxy con el conductor y botón SOS en emergencias.',
    color: '#7c3aed',
    bg: '#f5f3ff',
    feature: [
      { icon: '🔐', text: 'Código de verificación único por viaje' },
      { icon: '📞', text: 'Número proxy — tu número real, protegido' },
      { icon: '🆘', text: 'Botón SOS con acceso a emergencias 24/7' },
    ],
  },
  {
    id: 'rewards',
    icon: '⭐',
    title: 'Gana puntos Going',
    subtitle: 'Cada viaje suma',
    desc: 'Acumula puntos en cada viaje, envío o reserva. Canjéalos por descuentos, tours y experiencias.',
    color: '#f59e0b',
    bg: '#fffbeb',
    feature: [
      { icon: '🚗', text: '+10 pts por cada viaje completado' },
      { icon: '👥', text: '+100 pts por referir a un amigo' },
      { icon: '🎟️', text: 'Canjea desde 500 pts' },
    ],
  },
];

export default function OnboardingPage() {
  const router   = useRouter();
  const [step, setStep] = useState(0);

  const current  = STEPS[step];
  const isLast   = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('going_onboarding_done', '1');
      router.replace('/auth/login');
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('going_onboarding_done', '1');
    router.replace('/auth/login');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: current.bg }}>

      {/* Skip */}
      <div className="flex justify-end px-6 pt-6">
        <button onClick={handleSkip} className="text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors">
          Omitir
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-4">
        {STEPS.map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            className="rounded-full transition-all"
            style={{
              width:  i === step ? 24 : 8,
              height: 8,
              background: i === step ? current.color : current.color + '40',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 text-center">
        <div className="text-8xl mb-6 animate-bounce" style={{ animationDuration: '2s' }}>
          {current.icon}
        </div>

        <p className="text-sm font-bold mb-2 uppercase tracking-widest" style={{ color: current.color }}>
          {current.subtitle}
        </p>
        <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
          {current.title}
        </h1>
        <p className="text-gray-500 text-base leading-relaxed max-w-sm">
          {current.desc}
        </p>

        {current.feature && (
          <div className="mt-8 space-y-3 w-full max-w-sm">
            {current.feature.map(f => (
              <div key={f.text} className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-3 text-left">
                <span className="text-xl flex-shrink-0">{f.icon}</span>
                <span className="text-sm text-gray-700 font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-8 pb-10 space-y-3">
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 shadow-lg"
          style={{ backgroundColor: current.color }}
        >
          {isLast ? '¡Empezar ahora! →' : 'Siguiente →'}
        </button>

        {step === 0 && (
          <p className="text-center text-xs text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-bold underline" style={{ color: current.color }}>
              Inicia sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
