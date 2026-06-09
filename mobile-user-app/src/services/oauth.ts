/**
 * OAuth helper — Google / Facebook social login.
 *
 * Flujo (server-side OAuth):
 *   1. Mobile abre WebView a `${API_BASE}/auth/{provider}?returnTo=going://oauth-callback`
 *   2. Backend (passport) maneja el OAuth dance con Google/Facebook
 *   3. Backend genera nuestro JWT y redirige a `going://oauth-callback?token=JWT&isNewUser=...`
 *   4. WebBrowser.openAuthSessionAsync detecta el deep link y devuelve la URL
 *   5. Acá extraemos `token` de la query string y devolvemos al caller
 *
 * El backend ya valida que `going://oauth-callback` esté en `ALLOWED_RETURN_URLS`.
 * Requisitos previos a configurar (ops):
 *   - Cloud Run env: agregar `going://oauth-callback` a ALLOWED_RETURN_URLS
 *   - Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
 */
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'https://api.goingec.com';

const RETURN_TO = 'going://oauth-callback';

export type OAuthProvider = 'google' | 'facebook';

export type OAuthResult =
  | { ok: true;  token: string; isNewUser: boolean }
  | { ok: false; reason: 'cancel' | 'no_token' | 'error'; message?: string };

/**
 * Inicia el flow OAuth con el proveedor indicado. Abre el WebView del sistema
 * (Custom Tabs en Android, ASWebAuthenticationSession en iOS) y espera el
 * deep link de vuelta.
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<OAuthResult> {
  const url = `${API_BASE}/auth/${provider}?returnTo=${encodeURIComponent(RETURN_TO)}`;

  let result: WebBrowser.WebBrowserAuthSessionResult;
  try {
    result = await WebBrowser.openAuthSessionAsync(url, RETURN_TO);
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message ?? 'No se pudo abrir el navegador.' };
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { ok: false, reason: 'cancel' };
  }
  if (result.type !== 'success' || !result.url) {
    return { ok: false, reason: 'error', message: 'El proveedor no devolvió una respuesta válida.' };
  }

  // Parsear ?token=...&isNewUser=...
  // URL custom scheme: 'going://oauth-callback?token=xxx&isNewUser=true'
  const queryIdx = result.url.indexOf('?');
  if (queryIdx < 0) return { ok: false, reason: 'no_token' };

  const params = new URLSearchParams(result.url.slice(queryIdx + 1));
  const token = params.get('token');
  const isNewUser = params.get('isNewUser') === 'true';

  if (!token) return { ok: false, reason: 'no_token' };
  return { ok: true, token, isNewUser };
}
