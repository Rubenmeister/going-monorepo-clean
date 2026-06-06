import { Result, ok, err } from 'neverthrow';
import type { IAuthRepository, Session } from '@going-monorepo-clean/domains-user-frontend-core';

const AUTH_TOKEN_KEY = 'authToken';
const API_BASE = process.env['NX_API_URL'] || '/api';

export class HttpAuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<Result<Session, Error>> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return err(new Error(`Error de autenticación: ${res.status}`));
      const data = await res.json();
      const session: Session = {
        token: data.token,
        userId: data.user.id,
        firstName: data.user.firstName,
        roles: data.user.roles,
      };
      await this.saveSession(session);
      return ok(session);
    } catch (e) {
      return err(new Error('Error de conexión al autenticarse.'));
    }
  }

  async loadSession(): Promise<Result<Session | null, Error>> {
    try {
      if (typeof window === 'undefined') return ok(null);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return ok(null);
      const payload = JSON.parse(atob(token.split('.')[1]));
      return ok({
        token,
        userId: payload.sub,
        firstName: payload.firstName || 'Usuario',
        roles: payload.roles || [],
      });
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return err(new Error('Token inválido o expirado.'));
    }
  }

  async saveSession(session: Session): Promise<Result<void, Error>> {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, session.token);
      return ok(undefined);
    } catch (e) {
      return err(new Error('No se pudo guardar la sesión.'));
    }
  }

  async clearSession(): Promise<Result<void, Error>> {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return ok(undefined);
  }
}
