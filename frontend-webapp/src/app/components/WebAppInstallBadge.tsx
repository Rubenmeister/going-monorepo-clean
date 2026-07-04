'use client';

import { useEffect, useState } from 'react';

/**
 * Badge para instalar la App Web (PWA) de Going en el dispositivo.
 *
 * - Captura el evento `beforeinstallprompt` (Chrome/Edge/Android) y al hacer
 *   clic dispara el instalador nativo del navegador.
 * - Si el navegador no lo soporta (iOS Safari, etc.) o ya está instalada,
 *   muestra instrucciones para "Agregar a pantalla de inicio".
 *
 * El sitio ya es PWA instalable (public/manifest.json + sw.js).
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function WebAppInstallBadge() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(display-mode: standalone)').matches
    ) {
      setInstalled(true);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <span className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/10 text-white/80 border border-white/15">
        <span className="text-3xl">✅</span>
        <span className="text-left">
          <span className="block text-[11px] font-medium uppercase tracking-wider opacity-70">Ya la tienes</span>
          <span className="block font-black text-lg leading-tight">App Web instalada</span>
        </span>
      </span>
    );
  }

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      try {
        await deferred.userChoice;
      } catch {
        /* usuario cerró el diálogo */
      }
      setDeferred(null);
    } else {
      setShowHelp((v) => !v);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white text-gray-900 hover:scale-[1.03] transition-all shadow-xl"
      >
        <span className="text-3xl">🌐</span>
        <span className="text-left">
          <span className="block text-[11px] font-medium uppercase tracking-wider opacity-70">Instálala como</span>
          <span className="block font-black text-lg leading-tight">App Web</span>
        </span>
      </button>
      {showHelp && (
        <p className="text-white/60 text-xs max-w-[16rem]">
          En tu navegador, abre el menú (⋮) y elige{' '}
          <span className="font-semibold text-white/80">“Agregar a pantalla de inicio”</span>.
          En iPhone: botón Compartir → “Agregar a inicio”.
        </p>
      )}
    </div>
  );
}
