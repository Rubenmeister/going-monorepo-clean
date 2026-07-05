'use client';

import { useEffect, useState } from 'react';

/**
 * FloatingInstallPrompt
 *
 * Aviso flotante y DESCARTABLE para instalar la App Web (PWA) de Going, visible
 * en TODAS las páginas (se monta una sola vez en el layout). Complementa al
 * WebAppInstallBadge del landing, que queda enterrado hasta el fondo.
 *
 * Comportamiento:
 *  - Chrome/Edge/Android: captura `beforeinstallprompt` y al tocar dispara el
 *    instalador nativo del navegador.
 *  - iPhone/iPad (Safari no soporta beforeinstallprompt): muestra la instrucción
 *    "Compartir → Agregar a inicio".
 *  - Si YA está instalada (display-mode: standalone) → no aparece.
 *  - Si el usuario la descarta → se guarda en localStorage y no reaparece por
 *    14 días (para no ser molesto).
 *
 * La PWA en sí ya está cableada (public/manifest.json + public/sw.js +
 * PWARegister). Este componente solo la hace DESCUBRIBLE.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'going-pwa-install-dismissed';
const DISMISS_DAYS = 14;

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ se presenta como Mac con touch → detectar por maxTouchPoints.
  const iPadOS = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1;
  return iOSDevice || iPadOS;
}

// ── Iconos inline (sin emojis en el CTA principal) ────────────────────────────
const IcoDownload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IcoShareIos = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16V4" />
    <polyline points="8 8 12 4 16 8" />
    <path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
  </svg>
);

export function FloatingInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ya instalada → nunca mostrar.
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS Safari expone navigator.standalone cuando corre como app instalada.
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (recentlyDismissed()) return;

    // iOS: no hay beforeinstallprompt → ofrecemos la instrucción manual.
    if (isIos()) {
      setIos(true);
      setVisible(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowIosHelp(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* localStorage no disponible — no bloquea */
    }
  };

  const handleInstall = async () => {
    if (ios) {
      setShowIosHelp((v) => !v);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    try {
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') setVisible(false);
    } catch {
      /* usuario cerró el diálogo */
    }
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] max-w-[calc(100vw-2rem)] sm:max-w-sm">
      <div className="flex items-start gap-3 rounded-2xl bg-white shadow-2xl border border-gray-100 p-3.5 pr-2.5">
        {/* Logo / icono */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: 'linear-gradient(135deg, #0033A0, #ff4c41)' }}
        >
          <IcoDownload />
        </div>

        {/* Texto + acción */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900 leading-tight">Instala Going App</p>
          <p className="text-xs text-gray-500 leading-snug mt-0.5">
            {ios
              ? 'Añádela a tu pantalla de inicio para abrirla como una app.'
              : 'Tenla en tu pantalla de inicio — se abre como app, sin tienda.'}
          </p>

          {ios && showIosHelp && (
            <p className="mt-2 text-xs text-gray-600 leading-snug bg-gray-50 rounded-lg px-2.5 py-2">
              <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                Toca <IcoShareIos /> Compartir
              </span>{' '}
              en la barra de Safari y elige{' '}
              <span className="font-semibold text-gray-800">“Agregar a inicio”</span>.
            </p>
          )}

          <button
            onClick={handleInstall}
            className="mt-2 inline-flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-xl active:scale-[0.98] transition-transform"
            style={{ background: '#0033A0' }}
          >
            {ios ? (showIosHelp ? 'Ocultar cómo' : 'Cómo instalar') : 'Instalar app'}
          </button>
        </div>

        {/* Cerrar */}
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
