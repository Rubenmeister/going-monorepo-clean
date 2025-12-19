import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IPasswordHasher } from '@going-monorepo-clean/domains-user-core'; // Reemplaza con tu scope

@Injectable()
export class BcryptHasher implements IPasswordHasher {
  private readonly SALT_ROUNDS = 10;

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}