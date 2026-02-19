import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser decorator
 * Extracts authenticated user information from JWT
 *
 * Usage:
 * @CurrentUser('userId') userId: UUID
 * @CurrentUser('email') email: string
 * @CurrentUser('roles') roles: string[]
 * @CurrentUser() user: any // Get entire user object
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // If specific property requested, return it
    if (data) {
      return user[data];
    }

    // Otherwise return entire user object
    return user;
  },
);
