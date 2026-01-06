import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ClerkPassportStrategy } from './clerk.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'clerk' }),
    ConfigModule,
  ],
  providers: [ClerkPassportStrategy],
  exports: [PassportModule],
})
export class AuthModule {}