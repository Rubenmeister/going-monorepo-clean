import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ITrackingRepository,
  DriverLocation,
} from '@going-monorepo-clean/domains-tracking-core';

@Injectable()
export class GetActiveDriversUseCase {
  constructor(
    @Inject(ITrackingRepository)
    private readonly trackingRepository: ITrackingRepository
  ) {}

  async execute(): Promise<DriverLocation[]> {
    const result = await this.trackingRepository.findAllActive();
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value;
  }
}
