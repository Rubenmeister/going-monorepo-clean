import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { persistSession } from '../../lib/auth';

/**
 * Callback OAuth del corporate-portal.
 *
 * El user-auth-service redirige aquí tras un login Google/Facebook con:
 *   /auth/callback?token=<JWT>&isNewUser=<true|false>
 *
 * Persistimos sesión y vamos al dashboard. Si no hay token o es inválido,
 * volvemos al login con un mensaje de error.
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const token = typeof router.query.token === 'string' ? router.query.token : '';
    if (!token) {
      router.replace('/auth/login?error=oauth_failed');
      return;
    }

    // Validamos estructura del JWT (no firma — eso lo hizo el backend)
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      JSON.parse(atob(b64));
    } catch {
      router.replace('/auth/login?error=invalid_token');
      return;
    }

    persistSession({ accessToken: token });
    router.replace('/dashboard');
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#011627' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#ff4c41] rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Verificando credenciales...</p>
      </div>
    </div>
  );
}
