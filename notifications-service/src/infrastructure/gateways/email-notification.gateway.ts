import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import * as nodemailer from 'nodemailer';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

/**
 * Gateway de correo por SMTP genérico.
 *
 * Deliberadamente NO se ata a un proveedor: hoy usa la cuenta de Gmail que ya
 * envía los correos de "define tu clave" (mismas credenciales), y cambiar a
 * Brevo, SendGrid o cualquier otro es cuestión de variables de entorno, sin
 * tocar código.
 *
 * Variables (todas opcionales salvo la clave):
 *   SMTP_HOST  (def. smtp.gmail.com)   SMTP_PORT (def. 465)
 *   SMTP_USER  (def. GMAIL_USER)       SMTP_PASS (def. GMAIL_APP_PASSWORD)
 *   SMTP_FROM  (def. el usuario)
 *
 * DESTINATARIO: sale de `data.email` de la notificación — quien emite el aviso
 * sabe a quién escribirle.
 *
 * Antes esto usaba el SDK de SendGrid y resolvía el destinatario con un mock
 * que devolvía null, retornando ok(): NUNCA enviaba un correo y no quedaba
 * rastro del fallo. Aquí la falta de credenciales o de destinatario devuelve
 * ERROR: un aviso que no salió tiene que verse.
 */
@Injectable()
export class SendGridEmailGateway implements INotificationGateway {
  private readonly logger = new Logger(SendGridEmailGateway.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private get user(): string {
    return (
      this.config.get<string>('SMTP_USER') ||
      this.config.get<string>('GMAIL_USER') ||
      'goingappecuador@gmail.com'
    );
  }

  private get pass(): string {
    return (
      this.config.get<string>('SMTP_PASS') ||
      this.config.get<string>('GMAIL_APP_PASSWORD') ||
      ''
    );
  }

  private get from(): string {
    return this.config.get<string>('SMTP_FROM') || `Going App <${this.user}>`;
  }

  /** Transport perezoso: se crea al primer envío y se reutiliza. */
  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;
    if (!this.pass) return null;

    const port = Number(this.config.get<string>('SMTP_PORT') ?? 465);
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: this.user, pass: this.pass },
    });
    return this.transporter;
  }

  async send(notification: Notification): Promise<Result<void, Error>> {
    const props: any = notification.toPrimitives();
    const destino = String(props.data?.email ?? props.data?.to ?? '').trim();

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.error(
        '[EMAIL] Sin credenciales SMTP (SMTP_PASS / GMAIL_APP_PASSWORD) — no se envía',
      );
      return err(new Error('SMTP no configurado'));
    }

    if (!destino || !this.emailValido(destino)) {
      this.logger.warn(
        `[EMAIL] Notificación sin destinatario válido (userId=${props.userId}) — no se envía`,
      );
      return err(new Error('Notificación sin email destino'));
    }

    try {
      const { asunto, html, texto } = this.construirCorreo(props);
      const info = await transporter.sendMail({
        from: this.from,
        to: destino,
        subject: asunto,
        text: texto,
        html,
      });
      this.logger.log(`[EMAIL] Enviado a ${this.enmascarar(destino)} (${asunto}) id=${info.messageId}`);
      return ok(undefined);
    } catch (e: any) {
      this.logger.error(`[EMAIL] Falló el envío: ${e?.message}`);
      return err(new Error(`Email: ${e?.message}`));
    }
  }

  private emailValido(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  /** No dejamos correos completos en los logs. */
  private enmascarar(email: string): string {
    const [u, d] = email.split('@');
    return `${u.slice(0, 2)}***@${d ?? ''}`;
  }

  private construirCorreo(props: any): { asunto: string; html: string; texto: string } {
    const asunto = props.title || 'Aviso de Going App';
    const cuerpo = props.body || '';
    const url = props.data?.url;
    const texto = `${asunto}\n\n${cuerpo}${url ? `\n\n${url}` : ''}`;

    const html = `<!doctype html>
<html lang="es"><body style="margin:0;background:#f1f5f9;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#1d4ed8;padding:18px 24px">
      <span style="color:#fff;font-size:18px;font-weight:700">Going App</span>
    </div>
    <div style="padding:24px">
      <h1 style="margin:0 0 12px;font-size:18px;color:#0f172a">${this.escapar(asunto)}</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#334155">${this.escapar(cuerpo)}</p>
      ${
        url
          ? `<p style="margin:24px 0 0"><a href="${this.escapar(url)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px">Ver detalle</a></p>`
          : ''
      }
    </div>
    <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;font-size:12px;color:#64748b">
        Going App · Movilidad corporativa · Ecuador
      </p>
    </div>
  </div>
</body></html>`;

    return { asunto, html, texto };
  }

  private escapar(s: string): string {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
