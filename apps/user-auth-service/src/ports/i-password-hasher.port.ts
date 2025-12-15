export const I_PASSWORD_HASHER = Symbol('IPasswordHasher');

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
}
