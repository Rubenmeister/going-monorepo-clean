import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';

// Puertos de Dominio requeridos por la Capa de Aplicación
import {
  I_EMAIL_SENDER, 
  IEmailSender, 
  I_NOTIFICATION_REPOSITORY, 
  INotificationRepository,
  Notification, 
  NotificationType,
} from '@going-monorepo-clean/domains-notifications-core'; 
import { UUID } from '@going-monorepo-clean/shared-domain';

// DTO de Entrada: Datos que vienen de la API/Microservicio de Booking
export interface SendBookingConfirmationDto {
  bookingId: string;
  userEmail: string;
  userName: string;
  experienceName: string;
  totalPrice: number;
}

@Injectable()
export class SendBookingConfirmationUseCase {
  
  constructor(
    // Inyectamos el Puerto (Interfaz) para el envío de Emails
    @Inject(I_EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
    
    // Inyectamos el Puerto (Interfaz) para guardar el historial
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(dto: SendBookingConfirmationDto): Promise<Result<void, Error>> {
    
    // 1. Crear el cuerpo del Email (Lógica de Aplicación)
    const emailSubject = `✅ ¡Reserva Confirmada! ${dto.experienceName}`;
    const emailBody = `Hola ${dto.userName}, tu reserva por ${dto.totalPrice} ha sido confirmada.`;

    // 2. Intentar Enviar el Email (Uso del Puerto de Salida)
    const sendResult = await this.emailSender.sendEmail({
      to: dto.userEmail,
      subject: emailSubject,
      body: emailBody,
    });
    
    // 3. Crear y Persistir la Entidad de Notificación (Historial)
    const notificationProps = {
        recipient: dto.userEmail,
        type: 'email' as NotificationType,
        subject: emailSubject,
        relatedEntityId: new UUID(dto.bookingId), // Convertir string a UUID de dominio
    };
    
    let notification: Notification;

    if (sendResult.isErr()) {
        // 3a. Fallo en el envío: Registrar como FALLIDO
        notification = Notification.createFailed(notificationProps, sendResult.error.message);
        await this.notificationRepository.save(notification);
        
        // Retornar el error al servicio que lo llamó (ej. Booking-Service)
        return err(new Error(`Fallo al enviar notificación: ${sendResult.error.message}`));

    } else {
        // 3b. Éxito: Registrar como ENVIADO
        notification = Notification.createSent(notificationProps);
        await this.notificationRepository.save(notification);
        
        return ok(undefined);
    }
  }
}