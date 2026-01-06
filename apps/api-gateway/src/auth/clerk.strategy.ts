import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { createClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkPassportStrategy extends PassportStrategy(Strategy, 'clerk') {
  private clerkClient;

  constructor(private readonly configService: ConfigService) {
    super();
    this.clerkClient = createClerkClient({
      secretKey: this.configService.get('CLERK_SECRET_KEY'),
      publishableKey: this.configService.get('CLERK_PUBLISHABLE_KEY'),
    });
  }

  async validate(req: any): Promise<any> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const session = await this.clerkClient.verifyToken(token);
      
      // Mapear datos de Clerk a nuestro objeto de usuario
      // Podrías buscar al usuario en la DB aquí si es necesario
      return {
        userId: session.sub,
        email: session.email,
        // En Clerk los roles suelen venir en metadata o grupos
        role: session.metadata?.role || 'USER', 
      };
    } catch {
      throw new UnauthorizedException('Invalid session token');
    }
  }
}
