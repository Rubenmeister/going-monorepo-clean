import {
  Host,
  IHostRepository,
} from '@going-monorepo-clean/domains-anfitriones-core';
import { Result, ok, err } from 'neverthrow';

export interface CreateHostDto {
  userId: string;
  name: string;
  phone?: string;
}

export class CreateHostUseCase {
  constructor(private readonly hostRepo: IHostRepository) {}

  async execute(dto: CreateHostDto): Promise<Result<Host, Error>> {
    const existingHost = await this.hostRepo.findByUserId(dto.userId);

    if (existingHost.isOk() && existingHost.value) {
      return err(new Error('Host profile already exists for this user'));
    }

    const hostOrError = Host.create({
      userId: dto.userId,
      name: dto.name,
      phone: dto.phone,
    });

    if (hostOrError.isErr()) {
      return err(hostOrError.error);
    }

    const host = hostOrError.value;
    const saveResult = await this.hostRepo.save(host);

    if (saveResult.isErr()) {
      return err(saveResult.error);
    }

    return ok(host);
  }
}
