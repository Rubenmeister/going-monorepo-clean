import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { IParcelRepository, Parcel } from '@going-monorepo-clean/domains-parcel-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class GetParcelByIdUseCase {
  constructor(
    @Inject(IParcelRepository)
    private readonly parcelRepo: IParcelRepository,
  ) {}

  async execute(id: UUID): Promise<Parcel> {
    const result = await this.parcelRepo.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Parcel with ID ${id} not found.`);
    }
    return result.value;
  }
}
