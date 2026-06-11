import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any, info: any) {
    if (err) throw err;
    // Fail-closed: sin user válido → 401 (antes devolvía null y dejaba pasar). Auditoría #4/#15/#16.
    if (!user) throw new UnauthorizedException(info?.message ?? "Token inválido o ausente");
    return user;
  }
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    if (data) return user[data];
    return user;
  }
);
