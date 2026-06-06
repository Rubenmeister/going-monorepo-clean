import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import { Parcel, IParcelRepository } from '@going-monorepo-clean/domains-parcel-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';

@Injectable()
export class FindParcelsByUserUseCase {
  constructor(
    @Inject(IParcelRepository)
    private readonly parcelRepository: IParcelRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(userId: string): Promise<Result<Parcel[], Error>> {
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado.'));
    }
    const token = sessionResult.value.token;
    return this.parcelRepository.findByUserId(userId, token);
  }
}
