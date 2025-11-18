import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import {
  Booking,
  IBookingRepository,
  CreateBookingData,
} from '@going-monorepo-clean/domains-booking-core'; // Reemplaza con tu scope
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core'; // Reemplaza con tu scope
import { Money } from '@going-monorepo-clean/shared-domain';
import { CreateBookingDto } from '../dto/create-booking.dto';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepository: IBookingRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(dto: CreateBookingDto): Promise<Result<Booking, Error>> {
    // 1. Obtener el token de la sesión actual
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado. Por favor, inicia sesión.'));
    }
    const token = sessionResult.value.token;

    // 2. Convertir el DTO a los Value Objects del dominio
    const priceVO = Money.create(dto.totalPrice.amount, dto.totalPrice.currency)._unsafeUnwrap();

    // 3. Crear el objeto de datos para el repositorio
    const bookingData: CreateBookingData = {
      userId: dto.userId,
      serviceId: dto.serviceId,
      serviceType: dto.serviceType,
      totalPrice: priceVO,
      startDate: dto.startDate,
      endDate: dto.endDate,
    };

    // 4. Llamar al "Puerto" del repositorio (que hará la llamada HTTP)
    return this.bookingRepository.create(bookingData, token);
  }
}