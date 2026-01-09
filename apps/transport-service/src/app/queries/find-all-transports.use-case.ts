import { Injectable, Inject } from '@nestjs/common';
import { ITripRepository, Trip } from '@going-monorepo-clean/domains-transport-core';
import { Result } from 'neverthrow';

@Injectable()
export class FindAllTransportsUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly repository: ITripRepository
  ) {}

  async execute(): Promise<Result<Trip[], Error>> {
    return this.repository.findAll();
  }
}
