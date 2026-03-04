import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser parameter decorator
 * Extracts the authenticated user (or a specific field) from the HTTP request.
 * Usage:
 *   @CurrentUser() user: any
 *   @CurrentUser('userId') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    if (data) return user[data];
    return user;
  }
);
