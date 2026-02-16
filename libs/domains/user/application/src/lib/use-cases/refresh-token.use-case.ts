import { Inject, Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import {
  IUserRepository,
  ITokenService,
} from '@going-monorepo-clean/domains-user-core';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

export type RefreshResponseDto = {
  token: string;
  refreshToken: string;
};

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
    @Inject(ITokenService)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<RefreshResponseDto> {
    const decoded = this.tokenService.verifyRefreshToken(dto.refreshToken);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userResult = await this.userRepo.findById(decoded.userId);
    if (userResult.isErr()) {
      throw new InternalServerErrorException(userResult.error.message);
    }

    const user = userResult.value;
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const roles = user.roles.map(r => r.toPrimitives());
    const token = this.tokenService.generateAuthToken(user.id, user.email, roles);
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    return { token, refreshToken };
  }
}
