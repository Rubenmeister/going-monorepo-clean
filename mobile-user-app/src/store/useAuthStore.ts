/**
 * useAuthStore — Zustand auth state for mobile-user-app.
 *
 * Token storage is fully delegated to authService (SecureStore for tokens,
 * AsyncStorage for user profile). The store only tracks in-memory UI state.
 */
import { create } from 'zustand';
import { authAPI } from '@services/api';
import { authService, StoredUser } from '@services/authService';

/**
 * Normaliza el shape del usuario que llega del backend.
 * Acepta variantes (camelCase, snake_case, id/userId, .user envoltorio o raw).
 * Returns null si no hay forma de extraer un id válido.
 */
function normalizeUser(raw: any): StoredUser | null {
  if (!raw) return null;
  const u = raw.user ?? raw;
  const id = u?.id ?? u?.userId ?? u?._id ?? u?.user_id;
  if (!id) return null;
  return {
    id:        String(id),
    firstName: u.firstName ?? u.first_name ?? '',
    lastName:  u.lastName  ?? u.last_name  ?? '',
    email:     u.email     ?? '',
    phone:     u.phone     ?? '',
    roles:     Array.isArray(u.roles) ? u.roles : ['user'],
    avatar:    u.avatar,
  };
}

interface AuthState {
  token:    string | null;
  user:     StoredUser | null;
  isLoading: boolean;
  error:    string | null;

  /** Called once at app startup — restores session from SecureStore. */
  loadToken: () => Promise<void>;

  login:    (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName:  string;
    email:     string;
    password:  string;
    phone:     string;
  }) => Promise<void>;
  logout:   () => Promise<void>;

  /** OAuth deep-link: store a raw token and fetch the user profile. */
  loginWithOAuthToken: (token: string) => Promise<void>;

  clearError: () => void;
  setUser:    (user: StoredUser) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token:     null,
  user:      null,
  isLoading: false,
  error:     null,

  // ── Bootstrap ───────────────────────────────────────────────────────────

  loadToken: async () => {
    set({ isLoading: true });
    try {
      const token = await authService.bootstrap();
      if (!token) {
        // Sin sesión válida: NO borramos nada — bootstrap() ya distingue
        // "no hay token" de "error transient". Solo marcamos sin sesión.
        set({ token: null, user: null, isLoading: false });
        return;
      }
      const user = await authService.getUser();
      if (!user) {
        // Token exists but no user metadata — fetch it
        try {
          const { data } = await authAPI.me();
          const resolved = normalizeUser(data);
          if (!resolved) throw new Error('me() returned invalid user');
          await authService.saveUser(resolved);
          set({ token, user: resolved, isLoading: false });
        } catch {
          await authService.clearAll();
          set({ token: null, user: null, isLoading: false });
        }
      } else {
        set({ token, user, isLoading: false });
      }
    } catch {
      // Error transient (SecureStore frio, network). NO destruir tokens —
      // dejamos que el próximo arranque reintente. UI muestra Auth, pero
      // tokens válidos quedan disponibles.
      set({ token: null, user: null, isLoading: false });
    }
  },

  // ── Login / Register ─────────────────────────────────────────────────────

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.login(email, password);
      const accessToken  = data.accessToken  || data.token;
      const refreshToken = data.refreshToken || '';
      if (!accessToken) throw new Error('No se recibió token de autenticación');

      await authService.saveTokens({ accessToken, refreshToken, expiresIn: data.expiresIn });

      // Normalizar el user que viene de la respuesta. Si el backend no lo
      // entrega (o viene con campos faltantes), hidratar con /auth/me.
      let user = normalizeUser(data.user) ?? normalizeUser(data);
      if (!user) {
        const me = await authAPI.me();
        user = normalizeUser(me.data);
      }
      if (!user) throw new Error('No se pudo cargar el perfil del usuario');

      await authService.saveUser(user);
      set({ token: accessToken, user, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.message || e.message || 'Error al iniciar sesión',
        isLoading: false,
      });
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.register(formData);
      const accessToken  = data.accessToken  || data.token;
      const refreshToken = data.refreshToken || '';
      if (!accessToken) throw new Error('No se recibió token de autenticación');

      await authService.saveTokens({ accessToken, refreshToken, expiresIn: data.expiresIn });

      let user = normalizeUser(data.user) ?? normalizeUser(data);
      if (!user) {
        const me = await authAPI.me();
        user = normalizeUser(me.data);
      }
      if (!user) throw new Error('No se pudo cargar el perfil del usuario');

      await authService.saveUser(user);
      set({ token: accessToken, user, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.message || 'Error al registrarse',
        isLoading: false,
      });
    }
  },

  // ── Logout ───────────────────────────────────────────────────────────────

  logout: async () => {
    // Fire-and-forget backend logout (adds token to Redis blacklist)
    authAPI.logout().catch(() => {});
    // Clear local state immediately
    await authService.clearAll();
    set({ token: null, user: null });
  },

  // ── OAuth ─────────────────────────────────────────────────────────────────

  loginWithOAuthToken: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      // OAuth flows typically don't provide a refresh token upfront
      await authService.saveTokens({ accessToken: token, refreshToken: '' });
      const { data } = await authAPI.me();
      const user = normalizeUser(data);
      if (!user) throw new Error('No se pudo cargar el perfil del usuario');
      await authService.saveUser(user);
      set({ token, user, isLoading: false });
    } catch (e: any) {
      await authService.clearAll();
      set({
        token: null,
        user:  null,
        error: 'Error al completar el inicio de sesión con red social.',
        isLoading: false,
      });
      throw e;
    }
  },

  // ── Helpers ──────────────────────────────────────────────────────────────

  clearError: () => set({ error: null }),

  setUser: async (user: StoredUser) => {
    await authService.saveUser(user);
    set({ user });
  },
}));
