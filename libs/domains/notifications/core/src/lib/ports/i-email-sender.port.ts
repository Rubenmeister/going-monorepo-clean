import { Result } from 'neverthrow';

// Definimos el DTO de la Notificación que usará el puerto
export interface EmailNotification {
    to: string;       // Destinatario
    subject: string;  // Asunto
    body: string;     // Cuerpo del email (puede ser HTML)
}

// Usamos Symbol para inyección de dependencias
export const I_EMAIL_SENDER = Symbol('IEmailSender');

export interface IEmailSender {
    /**
     * Envía una notificación por correo electrónico.
     * @param notification Los detalles del email.
     * @returns Un Result para indicar éxito o fallo.
     */
    sendEmail(notification: EmailNotification): Promise<Result<void, Error>>;
}