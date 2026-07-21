import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from './admin-token.guard';
import { FareListService } from '../application/fare-list.service';

/**
 * Administración de listas de tarifas del motor — en vivo, sin deploy.
 * Todo bajo /admin/lists y protegido por AdminTokenGuard (header x-admin-token).
 */
@Controller('admin/lists')
@UseGuards(AdminTokenGuard)
export class FareListAdminController {
  constructor(private readonly lists: FareListService) {}

  /** Ver todas las listas (la activa primero). */
  @Get()
  list() {
    return this.lists.list();
  }

  /** Cargar una lista nueva (inactiva; activate:true para activarla de una). */
  @Post()
  @HttpCode(201)
  create(@Body() body: {
    name: string;
    service?: string; // compartido | privado | empresas | urbano
    shared?: Record<string, number>;
    privateFares?: Record<string, Record<string, number>>;
    rates?: Record<string, Record<string, number>>;
    source?: string;
    activate?: boolean;
  }) {
    return this.lists.create(body);
  }

  /** Activar una lista y retirar las demás (switch en vivo). */
  @Post(':id/activate')
  @HttpCode(200)
  activate(@Param('id') id: string) {
    return this.lists.activate(id);
  }

  /**
   * Añadir/editar rutas y precios en un BORRADOR (remove[] para quitar).
   * Sobre la lista activa devuelve 400: hay que publicar un borrador.
   */
  @Patch(':id/fares')
  @HttpCode(200)
  patchFares(@Param('id') id: string, @Body() body: {
    shared?: Record<string, number>;
    privateFares?: Record<string, Record<string, number>>;
    remove?: string[];
  }) {
    return this.lists.patchFares(id, body);
  }

  // ── Borrador → diff → publicación ────────────────────────────────────────

  /** Qué cambiaría si se publicara este borrador. No modifica nada. */
  @Get(':id/diff')
  diff(@Param('id') id: string) {
    return this.lists.diff(id);
  }

  /** Publica el borrador. El motivo es obligatorio y queda en el historial. */
  @Post(':id/publish')
  @HttpCode(200)
  publish(
    @Param('id') id: string,
    @Body() body: { publishedBy?: string; reason?: string },
  ) {
    return this.lists.publicar(id, body);
  }

  /** Historial de versiones de un servicio, con autor, fecha y motivo. */
  @Get('history/:service')
  history(@Param('service') service: string) {
    return this.lists.historial(service);
  }

  /**
   * Retira una lista de servicio (la deja inactiva). Solo para servicios que el
   * motor ya no consulta — para rotar versiones se usa `publish`.
   */
  @Post(':id/retire')
  @HttpCode(200)
  retire(@Param('id') id: string) {
    return this.lists.retirar(id);
  }

  /** Vuelve a una versión anterior copiándola como versión nueva. */
  @Post('rollback/:service/:version')
  @HttpCode(200)
  rollback(
    @Param('service') service: string,
    @Param('version') version: string,
    @Body() body: { publishedBy?: string; reason?: string },
  ) {
    return this.lists.volverA(Number(version), service, body);
  }

  /** Eliminar una lista vieja (no la activa). */
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.lists.remove(id);
  }
}
