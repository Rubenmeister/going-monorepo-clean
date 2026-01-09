import { Injectable, Inject } from '@nestjs/common';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { Result } from 'neverthrow';

@Injectable()
export class DeleteTransportUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly repository: ITripRepository
  ) {}

  async execute(id: string): Promise<Result<void, Error>> {
    return this.repository.delete(id);
  }
}
