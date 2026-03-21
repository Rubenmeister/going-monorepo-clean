import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * JWT Auth Guard
 * Protects routes by validating JWT tokens
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any) {
    if (err) {
      throw err;
    }
    if (!user) {
      return null;
    }
    return user;
  }
}

/**
 * @CurrentUser decorator
 * Extracts authenticated user information from JWT
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    if (data) {
      return user[data];
    }

    return user;
  }
);

/**
 * Message Repository Interface
 */
export interface IMessageRepository {
  create(message: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findByRideId(rideId: string, limit?: number): Promise<any[]>;
  findUnreadForUser(userId: string): Promise<any[]>;
  markAsRead(messageId: string): Promise<any>;
  findConversation(
    rideId: string,
    userId: string,
    otherUserId: string,
    limit?: number
  ): Promise<any[]>;
  delete(id: string): Promise<void>;
}
