import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DriverProfile, IDriverProfileRepository } from '@going-monorepo-clean/domains-transport-core';
import { RegisterDriverProfileDto } from '../dto/register-driver-profile.dto';

@Injectable()
export class RegisterDriverProfileUseCase {
  constructor(
    @Inject(IDriverProfileRepository)
    private readonly driverProfileRepo: IDriverProfileRepository,
  ) {}

  async execute(dto: RegisterDriverProfileDto): Promise<{ id: string }> {
    // Verificar si ya existe un perfil
    const existingResult = await this.driverProfileRepo.findByUserId(dto.userId);
    if (existingResult.isOk() && existingResult.value) {
      throw new InternalServerErrorException('Driver profile already exists for this user');
    }

    const profileResult = DriverProfile.create({
      userId: dto.userId,
      phone: dto.phone,
      whatsappNumber: dto.whatsappNumber,
    });

    if (profileResult.isErr()) {
      throw new InternalServerErrorException(profileResult.error.message);
    }

    const profile = profileResult.value;
    const saveResult = await this.driverProfileRepo.save(profile);
    if (saveResult.isErr()) throw new InternalServerErrorException(saveResult.error.message);

    return { id: profile.id };
  }
}
