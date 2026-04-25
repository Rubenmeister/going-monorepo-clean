import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IDriverBaseRepository,
  DriverBase,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class ListDriverBasesUseCase {
  constructor(
    @Inject(IDriverBaseRepository)
    private readonly baseRepo: IDriverBaseRepository,
  ) {}

  async execute(driverId: UUID): Promise<DriverBase[]> {
    const result = await this.baseRepo.findByDriverId(driverId);
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value;
  }
}
