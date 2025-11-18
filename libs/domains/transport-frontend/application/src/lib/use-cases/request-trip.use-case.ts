import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import {
  Trip,
  ITripRepository,
  RequestTripData,
} from '@going-monorepo-clean/domains-transport-core'; // Reemplaza con tu scope
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { Money, Location, UUID } from '@going-monorepo-clean/shared-domain';
import { RequestTripDto } from '../dto/request-trip.dto';

@Injectable()
export class RequestTripUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepository: ITripRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(dto: RequestTripDto): Promise<Result<Trip, Error>> {
    // 1. Obtener el token de la sesión actual
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado. Por favor, inicia sesión.'));
    }
    const token = sessionResult.value.token;

    // 2. Convertir el DTO a los Value Objects del dominio
    const priceVOResult = Money.create(dto.price.amount, dto.price.currency);
    const originVOResult = Location.create(dto.origin);
    const destinationVOResult = Location.create(dto.destination);

    if (priceVOResult.isErr()) return err(priceVOResult.error);
    if (originVOResult.isErr()) return err(originVOResult.error);
    if (destinationVOResult.isErr()) return err(destinationVOResult.error);

    // 3. Crear el objeto de datos para el repositorio
    const tripData: RequestTripData = {
      userId: dto.userId,
      origin: originVOResult.value,
      destination: destinationVOResult.value,
      price: priceVOResult.value,
    };

    // 4. Llamar al "Puerto" del repositorio (que hará la llamada HTTP)
    return this.tripRepository.request(tripData, token);
  }
}