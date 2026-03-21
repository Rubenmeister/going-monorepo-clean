/**
 * localAuth.ts
 * Auth local con localStorage — funciona sin backend.
 * Cuando el backend esté listo, basta con cambiar USE_LOCAL_AUTH a false.
 */

export const USE_LOCAL_AUTH = true; // ← cambiar a false cuando el backend esté activo

const USERS_KEY = 'going_users';
const SESSION_KEY = 'going_session';

export interface LocalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
  password: string; // guardada solo localmente en demo
  createdAt: string;
}

export interface LocalSession {
  token: string;
  user: Omit<LocalUser, 'password'>;
}

// ── Helpers de almacenamiento ────────────────────────────────────────────────

function getUsers(): LocalUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users: LocalUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateToken(userId: string): string {
  // Token simulado — no es un JWT real
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
  return `local.${payload}.demo`;
}

// ── API pública ──────────────────────────────────────────────────────────────

export function localRegister(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
}): LocalSession {
  const users = getUsers();

  if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('duplicate_email');
  }

  const newUser: LocalUser = {
    id: generateId(),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    roles: data.roles,
    password: data.password,
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);

  const session: LocalSession = {
    token: generateToken(newUser.id),
    user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, phone: newUser.phone, roles: newUser.roles, createdAt: newUser.createdAt },
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function localLogin(email: string, password: string): LocalSession {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) throw new Error('not_found');
  if (user.password !== password) throw new Error('invalid_credentials');

  const session: LocalSession = {
    token: generateToken(user.id),
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, roles: user.roles, createdAt: user.createdAt },
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function localGetSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalSession;
  } catch {
    return null;
  }
}

export function localLogout(): void {
  localStorage.removeItem(SESSION_KEY);
}
