import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../domain/ports';
import { UnifiedSearchUseCase } from '../application/use-cases';
import { SearchQueryDto, SearchResponseDto } from './dtos/search-query.dto';

/**
 * SearchController — buscador unificado de VIAJES.
 *
 * Un único punto de entrada que, a partir de origen + destino + preferencia
 * temporal, resuelve automáticamente si el viaje es urbano, interurbano o
 * corredor aeropuerto, y devuelve las opciones cotizadas.
 *
 * Los ENVÍOS van por su propio flujo (no por aquí).
 *
 * POST /search   → buscar opciones de viaje
 */
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly unifiedSearch: UnifiedSearchUseCase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async search(@Body() dto: SearchQueryDto): Promise<SearchResponseDto> {
    const result = await this.unifiedSearch.execute(dto);
    this.logger.debug(
      `search ${result.route.routeClass} ${result.route.originLabel ?? '?'}→${result.route.destinationLabel ?? '?'} · ${result.onDemandOptions.length} opción(es)`,
    );
    return result;
  }
}
