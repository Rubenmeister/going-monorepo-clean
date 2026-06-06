import { Result } from 'neverthrow';

export interface Session {
  token: string;
  userId: string;
  firstName: string;
  roles: string[];
}

export const IAuthRepository = Symbol('IAuthRepository');

export interface IAuthRepository {
  login(email: string, password: string): Promise<Result<Session, Error>>;
  loadSession(): Promise<Result<Session | null, Error>>;
  saveSession(session: Session): Promise<Result<void, Error>>;
  clearSession(): Promise<Result<void, Error>>;
}
