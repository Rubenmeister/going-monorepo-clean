import { Injectable } from '@nestjs/common';
import { IPasswordHasher } from '@going-monorepo-clean/domains-user-core';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
