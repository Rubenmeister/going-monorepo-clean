'use client';
export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * Callback OAuth del admin-dashboard.
 *
 * El user-auth-service redirige aquí tras un login con Google con:
 *   /auth/callback?token=<JWT>&isNewUser=<true|false>
 *
 * Guardamos el token en localStorage + cookie de sesión y redirigimos al panel.
 */
function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    try {
      // Validar que el JWT tenga estructura correcta (base64url → base64)
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      JSON.parse(atob(b64));
    } catch {
      router.replace('/login?error=invalid_token');
      return;
    }

    localStorage.setItem('authToken', token);
    document.cookie = `going_admin_session=1; path=/; SameSite=Strict`;

    // Para admin asumimos que ya verificó el rol en el backend; ir al panel
    router.replace('/');
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#ff4c41] rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Verificando credenciales...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800" />}>
      <CallbackHandler />
    </Suspense>
  );
}
