import { Controller, Get, Post, Param, InternalServerErrorException } from '@nestjs/common';
import { FindAllTransportsUseCase } from './queries/find-all-transports.use-case';
import { DeleteTransportUseCase } from './commands/delete-transport.use-case';

@Controller('transports')
export class TransportController {
  constructor(
    private readonly findAllUseCase: FindAllTransportsUseCase,
    private readonly deleteUseCase: DeleteTransportUseCase
  ) {}

  @Get()
  async findAll() {
    const result = await this.findAllUseCase.execute();

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    // Map domain entities to DTOs if necessary
    return result.value.map(trip => trip.toPrimitives());
  }

  @Post(':id/delete')
  async delete(@Param('id') id: string) {
    const result = await this.deleteUseCase.execute(id);

    if (result.isErr()) {
        throw new InternalServerErrorException(result.error.message);
    }

    return { success: true };
  }
}
