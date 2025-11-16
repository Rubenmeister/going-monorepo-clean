import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, // Módulo que maneja la validación de JWT
    ProxyModule, // Módulo que reenvía las peticiones HTTP
    TrackingModule, // Módulo que maneja los WebSockets
  ],
})
export class AppModule {}
