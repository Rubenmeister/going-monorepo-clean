import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { IParcelRepository } from '@going-monorepo-clean/domains-parcel-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { CreateParcelDto } from '../dto/create-parcel.dto';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

export interface ParcelViewModel {
  id: string;
  status: string;
  price: number;
}

@Injectable()
export class CreateParcelUseCase {
  constructor(
    @Inject(IParcelRepository)
    private readonly parcelRepository: IParcelRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: CreateParcelDto): Promise<Result<ParcelViewModel, Error>> {
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado.'));
    }
    const token = sessionResult.value.token;

    const priceVOResult = Money.create(dto.price.amount, dto.price.currency);
    if (priceVOResult.isErr()) return err(priceVOResult.error);

    const originVOResult = Location.create(dto.origin);
    const destinationVOResult = Location.create(dto.destination);
    if (originVOResult.isErr() || destinationVOResult.isErr()) {
      return err(new Error('Ubicación inválida.'));
    }

    const result = await this.parcelRepository.create(
      {
        userId: dto.userId,
        origin: originVOResult.value.toPrimitives(),
        destination: destinationVOResult.value.toPrimitives(),
        description: dto.description,
        price: priceVOResult.value.toPrimitives(),
      },
      token,
    );

    if (result.isErr()) return err(result.error);

    const parcel = result.value;
    return ok({ id: parcel.id, status: parcel.status, price: parcel.price.amount / 100 });
  }
}
