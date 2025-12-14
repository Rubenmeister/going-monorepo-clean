import { RoleType } from '@going-monorepo-clean/domains-user-core';

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: RoleType;
  };
}
