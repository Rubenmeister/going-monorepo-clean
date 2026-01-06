import { Inject, Injectable } from '@nestjs/common';
import {
  Trip,
  ITripRepository,
} from '@going-monorepo-clean/domains-transport-core';

@Injectable()
export class SearchTripsUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepo: ITripRepository,
  ) {}

  async execute(query: string): Promise<any[]> {
    // For now, we use a simple find all and filter approach if a specific search is not implemented
    // In a real scenario, this would be a DB-level query
    const trips = await this.tripRepo.findAll();
    
    return trips
      .filter(t => 
        !query || 
        t.id.toLowerCase().includes(query.toLowerCase()) || 
        t.driverId?.toLowerCase().includes(query.toLowerCase()) ||
        t.originCity.toLowerCase().includes(query.toLowerCase()) ||
        t.destCity.toLowerCase().includes(query.toLowerCase())
      )
      .map(t => t.toPrimitives());
  }
}
