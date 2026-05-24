import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import { UnifiedSearchUseCase } from '../application/use-cases';
import { SearchQueryDto, SearchResponseDto } from './dtos/search-query.dto';

/** Shape del JWT payload inyectado por @CurrentUser() */
interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
  roles?: string[];
  /** Empresa corporativa del usuario (audit #29) — del JWT (server-trust). */
  companyId?: string;
}

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
  async search(
    @CurrentUser() user: AuthUser,
    @Body() dto: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    // Server-side enforcement (audit #29): clientSegment se DERIVA del JWT
    // (user.companyId), no del body del cliente. Empresa que no marca el
    // segment NO puede evitar el +25%. Admin puede sobreescribir para QA.
    const isAdmin = (user.roles ?? [user.role]).includes('admin');
    const effective = isAdmin
      ? { ...dto, clientSegment: dto.clientSegment ?? (user.companyId ? 'corporate' : 'public') }
      : { ...dto, clientSegment: (user.companyId ? 'corporate' : 'public') as 'corporate' | 'public' };

    const result = await this.unifiedSearch.execute(effective);
    this.logger.debug(
      `search ${result.route.routeClass} ${result.route.originLabel ?? '?'}→${result.route.destinationLabel ?? '?'} · ${result.onDemandOptions.length} opción(es) · segment=${effective.clientSegment}`,
    );
    return result;
  }
}
