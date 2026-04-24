import { Injectable } from '@nestjs/common';
import { BaseJwtStrategy } from '@going-monorepo-clean/shared-infrastructure';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends BaseJwtStrategy {
  constructor(configService: ConfigService) {
    super(configService);
  }
}
