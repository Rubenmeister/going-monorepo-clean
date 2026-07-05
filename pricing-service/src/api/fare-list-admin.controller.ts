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
    shared?: Record<string, number>;
    privateFares?: Record<string, Record<string, number>>;
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

  /** Añadir/editar rutas y precios en una lista (remove[] para quitar). */
  @Patch(':id/fares')
  @HttpCode(200)
  patchFares(@Param('id') id: string, @Body() body: {
    shared?: Record<string, number>;
    privateFares?: Record<string, Record<string, number>>;
    remove?: string[];
  }) {
    return this.lists.patchFares(id, body);
  }

  /** Eliminar una lista vieja (no la activa). */
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.lists.remove(id);
  }
}
