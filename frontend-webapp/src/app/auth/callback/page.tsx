'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { setStoredAuth, clearStoredAuth } from '@/lib/providers/auth-client';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const isNewUser = searchParams.get('isNewUser') === 'true';

    if (!token) {
      router.replace('/auth/login?error=oauth_failed');
      return;
    }

    let cancelled = false;

    (async () => {
      // Persistir token: actualiza store + localStorage. El user lo derivamos
      // del JWT (campo `user` no viene en el callback OAuth).
      setStoredAuth(token, null, null);

      // Pedir al server que setee la cookie httpOnly de sesión. Sin este paso
      // el middleware bloquearía rutas protegidas aunque el token esté en
      // store/localStorage.
      try {
        const res = await fetch('/api/auth/oauth-session', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token }),
        });

        if (!res.ok) {
          await clearStoredAuth();
          if (!cancelled) router.replace('/auth/login?error=oauth_failed');
          return;
        }
      } catch (err) {
        console.error('[oauth callback] no se pudo establecer sesión', err);
        await clearStoredAuth();
        if (!cancelled) router.replace('/auth/login?error=oauth_failed');
        return;
      }

      if (cancelled) return;

      // window.location en lugar de router.replace: garantiza un request
      // fresco que incluye la cookie recién seteada.
      window.location.href = isNewUser ? '/auth/register?step=profile' : '/';
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Iniciando sesión...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
