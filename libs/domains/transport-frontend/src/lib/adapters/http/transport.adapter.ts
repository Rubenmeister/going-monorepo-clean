import { Injectable } from '@nestjs/common'; // O usar fetch si es cliente
import { ITripRepository } from '@myorg/domains/transport/core';

@Injectable()
export class HttpTransportAdapter implements ITripRepository {
  async save(trip: Trip): Promise<void> {
    // Lógica para llamar a transport-service
    await fetch('/api/transport/create', { method: 'POST', body: JSON.stringify(trip) });
  }

  // ... implementar otros métodos
}