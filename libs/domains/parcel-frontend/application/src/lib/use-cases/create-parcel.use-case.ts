import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import {
  Parcel,
  IParcelRepository,
  CreateParcelData,
} from '@going-monorepo-clean/domains-parcel-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';
import { CreateParcelDto } from '../dto/create-parcel.dto';

@Injectable()
export class CreateParcelUseCase {
  constructor(
    @Inject(IParcelRepository)
    private readonly parcelRepository: IParcelRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(dto: CreateParcelDto): Promise<Result<Parcel, Error>> {
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado. Por favor, inicia sesión.'));
    }
    const token = sessionResult.value.token;

    const priceVOResult = Money.create(dto.price.amount, dto.price.currency);
    const originVOResult = Location.create(dto.origin);
    const destinationVOResult = Location.create(dto.destination);

    if (priceVOResult.isErr()) return err(priceVOResult.error);
    if (originVOResult.isErr()) return err(originVOResult.error);
    if (destinationVOResult.isErr()) return err(destinationVOResult.error);

    const parcelData: CreateParcelData = {
      userId: dto.userId,
      origin: originVOResult.value,
      destination: destinationVOResult.value,
      description: dto.description,
      price: priceVOResult.value,
    };

    return this.parcelRepository.create(parcelData, token);
  }
}