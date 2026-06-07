'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch, getStoredToken, redirectToLogin } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.goingec.com';

type Phase = 'loading' | 'disabled' | 'setup' | 'enabled' | 'disabling';

export default function TwoFactorPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // setup data
  const [qr, setQr] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');

  // disable data
  const [password, setPassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && !getStoredToken()) { redirectToLogin('/account/2fa'); return; }
    authFetch(`${API_URL}/auth/mfa/status`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setPhase(d?.enabled ? 'enabled' : 'disabled'))
      .catch(() => setPhase('disabled'));
  }, []);

  const startSetup = async () => {
    setBusy(true); setError('');
    try {
      const r = await authFetch(`${API_URL}/auth/mfa/setup`, { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d?.message || 'No se pudo iniciar la configuración.'); return; }
      setQr(d.qrDataUrl || '');
      setManualCode(d.manualEntryCode || '');
      setRecoveryCodes(Array.isArray(d.recoveryCodes) ? d.recoveryCodes : []);
      setPhase('setup');
    } catch { setError('No se pudo conectar con el servidor.'); }
    finally { setBusy(false); }
  };

  const enable = async () => {
    setBusy(true); setError('');
    try {
      const r = await authFetch(`${API_URL}/auth/mfa/enable`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d?.message || 'Código inválido. Revisa tu app.'); return; }
      setPhase('enabled'); setCode('');
    } catch { setError('No se pudo conectar con el servidor.'); }
    finally { setBusy(false); }
  };

  const disable = async () => {
    setBusy(true); setError('');
    try {
      const r = await authFetch(`${API_URL}/auth/mfa/disable`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code: disableCode.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d?.message || 'No se pudo desactivar. Verifica contraseña y código.'); return; }
      setPhase('disabled'); setPassword(''); setDisableCode('');
    } catch { setError('No se pudo conectar con el servidor.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/account" className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">←</Link>
          <h1 className="text-xl font-bold text-gray-900">Autenticación de dos factores</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {error && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">{error}</div>}

        {phase === 'loading' && (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" /></div>
        )}

        {phase === 'disabled' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-4">
              Añade una capa extra de seguridad: además de tu contraseña, pediremos un código de tu
              app de autenticación (Google Authenticator, Authy, etc.) al iniciar sesión.
            </p>
            <button onClick={startSetup} disabled={busy}
              className="px-5 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ backgroundColor: '#ff4c41' }}>
              {busy ? 'Generando…' : 'Activar 2FA'}
            </button>
          </div>
        )}

        {phase === 'setup' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <p className="text-sm font-bold text-gray-800">1. Escanea el código QR con tu app</p>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Código QR 2FA" className="w-44 h-44 mx-auto border border-gray-100 rounded-xl" />
            )}
            {manualCode && (
              <p className="text-xs text-gray-500 text-center">
                ¿No puedes escanear? Ingresa esta clave: <span className="font-mono font-bold text-gray-800">{manualCode}</span>
              </p>
            )}

            {recoveryCodes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 mb-2">⚠️ Guarda tus códigos de recuperación (úsalos si pierdes tu app):</p>
                <div className="grid grid-cols-2 gap-1 font-mono text-sm text-amber-900">
                  {recoveryCodes.map(c => <span key={c}>{c}</span>)}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-bold text-gray-800 mb-2">2. Ingresa el código de 6 dígitos para confirmar</p>
              <input inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-xl tracking-[0.3em] font-bold focus:outline-none focus:ring-2 focus:ring-[#ff4c41]" />
            </div>
            <button onClick={enable} disabled={busy || code.length < 6}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ backgroundColor: '#ff4c41' }}>
              {busy ? 'Activando…' : 'Confirmar y activar'}
            </button>
          </div>
        )}

        {phase === 'enabled' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <span className="text-2xl">🔒</span>
              <p className="font-bold">La autenticación de dos factores está activada.</p>
            </div>
            <button onClick={() => setPhase('disabling')} className="text-sm text-red-500 font-semibold hover:underline">
              Desactivar 2FA
            </button>
          </div>
        )}

        {phase === 'disabling' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <p className="text-sm text-gray-600">Para desactivar, confirma tu contraseña y un código actual.</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Tu contraseña"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41]" />
            <input inputMode="numeric" maxLength={6} value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Código de 6 dígitos"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41]" />
            <div className="flex gap-2">
              <button onClick={() => { setPhase('enabled'); setError(''); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50">Cancelar</button>
              <button onClick={disable} disabled={busy || !password || disableCode.length < 6}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 bg-red-600 hover:bg-red-700">
                {busy ? 'Desactivando…' : 'Desactivar 2FA'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
