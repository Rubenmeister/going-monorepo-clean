import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { IUserRepository } from '../ports/iuser.repository';
import { ITokenService } from '../ports/itoken.service';
import { User, OAuthProvider } from '../entities/user.entity';

export interface OAuthLoginDto {
  email: string;
  firstName: string;
  lastName: string;
  oauthProvider: OAuthProvider;
  oauthId: string;
  profilePicture?: string;
}

export type OAuthLoginResponseDto = {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    roles: string[];
    profilePicture?: string;
  };
  isNewUser: boolean;
};

@Injectable()
export class OAuthLoginUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
    @Inject(ITokenService)
    private readonly tokenService: ITokenService
  ) {}

  async execute(dto: OAuthLoginDto): Promise<OAuthLoginResponseDto> {
    // 1. Try to find existing user by oauthId
    const byOAuthResult = await this.userRepo.findByOAuthId(
      dto.oauthProvider,
      dto.oauthId
    );
    if (byOAuthResult.isErr()) {
      throw new InternalServerErrorException(byOAuthResult.error.message);
    }

    let user: User | null = byOAuthResult.value;
    let isNewUser = false;

    if (!user) {
      // 2. Try to find by email (account merge: same email, different provider)
      const byEmailResult = await this.userRepo.findByEmail(dto.email);
      if (byEmailResult.isErr()) {
        throw new InternalServerErrorException(byEmailResult.error.message);
      }
      user = byEmailResult.value;

      if (user) {
        // Existing account — update with OAuth info
        const updated = User.fromPrimitives({
          ...user.toPrimitives(),
          oauthProvider: dto.oauthProvider,
          oauthId: dto.oauthId,
          profilePicture: dto.profilePicture ?? user.profilePicture,
        });
        const updateResult = await this.userRepo.update(updated);
        if (updateResult.isErr()) {
          throw new InternalServerErrorException(updateResult.error.message);
        }
        user = updated;
      } else {
        // 3. New user — create via OAuth
        const createResult = User.createOAuth({
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          oauthProvider: dto.oauthProvider,
          oauthId: dto.oauthId,
          profilePicture: dto.profilePicture,
        });
        if (createResult.isErr()) {
          throw new InternalServerErrorException(createResult.error.message);
        }
        user = createResult.value;
        const saveResult = await this.userRepo.save(user);
        if (saveResult.isErr()) {
          throw new InternalServerErrorException(saveResult.error.message);
        }
        isNewUser = true;
      }
    }

    const roles = user.roles.map((r) => r.toPrimitives());
    const token = this.tokenService.generateAuthToken(user.id, user.email, roles);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        roles,
        profilePicture: user.profilePicture,
      },
      isNewUser,
    };
  }
}
