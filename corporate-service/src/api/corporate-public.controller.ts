import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { CorporateService } from './corporate.service';

/**
 * Endpoints PÚBLICOS de Empresas (sin JWT): el formulario de alta del sitio.
 * Prefijo aparte (`/corporate/public`) para NO heredar el JwtAuthGuard del
 * CorporateController — un prospecto no está logueado. El resto de Empresas
 * sigue protegido en CorporateController.
 */
@Controller('corporate/public')
export class CorporatePublicController {
  constructor(private readonly svc: CorporateService) {}

  /** POST /corporate/public/applications — alta de solicitud de empresa. */
  @Post('applications')
  async createApplication(
    @Body()
    body: {
      razonSocial?: string;
      ruc?: string;
      tipoCuenta?: string;
      contactoNombre?: string;
      contactoEmail?: string;
      contactoTelefono?: string;
      ciudad?: string;
      empleadosEstimados?: number;
      notas?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    for (const f of ['razonSocial', 'ruc', 'contactoNombre', 'contactoEmail'] as const) {
      if (!body?.[f] || String(body[f]).trim() === '') {
        throw new BadRequestException(`Campo requerido: ${f}`);
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(String(body.contactoEmail))) {
      throw new BadRequestException('contactoEmail inválido');
    }
    return this.svc.createApplication({
      razonSocial: body.razonSocial!,
      ruc: body.ruc!,
      tipoCuenta: body.tipoCuenta,
      contactoNombre: body.contactoNombre!,
      contactoEmail: body.contactoEmail!,
      contactoTelefono: body.contactoTelefono,
      ciudad: body.ciudad,
      empleadosEstimados: body.empleadosEstimados,
      notas: body.notas,
      metadata: body.metadata,
    });
  }
}
