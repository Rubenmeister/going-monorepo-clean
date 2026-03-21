import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CorporateRbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // RBAC is enforced inline in the controller
    return true;
  }
}
