import { Injectable, Inject } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { Host, I_HOST_REPOSITORY, IHostRepository } from '@going-monorepo-clean/domains-anfitriones-core';
import { RegisterHostDto } from '../dto/register-host.dto';

@Injectable()
export class RegisterHostUseCase {
  constructor(
    @Inject(I_HOST_REPOSITORY)
    private readonly hostRepo: IHostRepository,
  ) {}

  async execute(dto: RegisterHostDto): Promise<Result<Host, Error>> {
    // Create host entity
    const hostResult = Host.create({
      userId: dto.userId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
    });

    if (hostResult.isErr()) {
      return err(hostResult.error);
    }

    const host = hostResult.value;
    
    // Save to repository
    const saveResult = await this.hostRepo.save(host);
    
    if (saveResult.isErr()) {
      return err(saveResult.error);
    }

    return ok(host);
  }
}