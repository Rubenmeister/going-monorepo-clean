import { Result, ok, err } from 'neverthrow';

export enum NotificationTemplateName {
  TRIP_REQUESTED = 'trip_requested',
  TRIP_DRIVER_ASSIGNED = 'trip_driver_assigned',
  TRIP_DRIVER_APPROACHING = 'trip_driver_approaching',
  TRIP_DRIVER_ARRIVED = 'trip_driver_arrived',
  TRIP_STARTED = 'trip_started',
  TRIP_COMPLETED = 'trip_completed',
  TRIP_CANCELLED = 'trip_cancelled',
  CHAT_NEW_MESSAGE = 'chat_new_message',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
}

export interface NotificationTemplateProps {
  name: NotificationTemplateName;
  titleTemplate: string;
  bodyTemplate: string;
}

const TEMPLATES: Record<NotificationTemplateName, NotificationTemplateProps> = {
  [NotificationTemplateName.TRIP_REQUESTED]: {
    name: NotificationTemplateName.TRIP_REQUESTED,
    titleTemplate: 'Viaje solicitado',
    bodyTemplate: 'Tu viaje desde {{origin}} hacia {{destination}} ha sido registrado. Buscando conductor...',
  },
  [NotificationTemplateName.TRIP_DRIVER_ASSIGNED]: {
    name: NotificationTemplateName.TRIP_DRIVER_ASSIGNED,
    titleTemplate: 'Conductor asignado',
    bodyTemplate: '{{driverName}} ha sido asignado a tu viaje. Vehículo: {{vehicleInfo}}. ETA: {{etaMinutes}} min.',
  },
  [NotificationTemplateName.TRIP_DRIVER_APPROACHING]: {
    name: NotificationTemplateName.TRIP_DRIVER_APPROACHING,
    titleTemplate: 'Conductor en camino',
    bodyTemplate: 'Tu conductor está a {{distanceKm}} km. Llegará en aproximadamente {{etaMinutes}} minutos.',
  },
  [NotificationTemplateName.TRIP_DRIVER_ARRIVED]: {
    name: NotificationTemplateName.TRIP_DRIVER_ARRIVED,
    titleTemplate: 'Conductor llegó',
    bodyTemplate: 'Tu conductor ha llegado al punto de recogida. ¡Sal a encontrarlo!',
  },
  [NotificationTemplateName.TRIP_STARTED]: {
    name: NotificationTemplateName.TRIP_STARTED,
    titleTemplate: 'Viaje iniciado',
    bodyTemplate: 'Tu viaje hacia {{destination}} ha comenzado. ¡Buen viaje!',
  },
  [NotificationTemplateName.TRIP_COMPLETED]: {
    name: NotificationTemplateName.TRIP_COMPLETED,
    titleTemplate: 'Viaje completado',
    bodyTemplate: 'Has llegado a {{destination}}. Total: {{amount}} {{currency}}. ¡Gracias por viajar con nosotros!',
  },
  [NotificationTemplateName.TRIP_CANCELLED]: {
    name: NotificationTemplateName.TRIP_CANCELLED,
    titleTemplate: 'Viaje cancelado',
    bodyTemplate: 'Tu viaje ha sido cancelado. Motivo: {{reason}}.',
  },
  [NotificationTemplateName.CHAT_NEW_MESSAGE]: {
    name: NotificationTemplateName.CHAT_NEW_MESSAGE,
    titleTemplate: 'Nuevo mensaje',
    bodyTemplate: '{{senderName}}: {{messagePreview}}',
  },
  [NotificationTemplateName.PAYMENT_RECEIVED]: {
    name: NotificationTemplateName.PAYMENT_RECEIVED,
    titleTemplate: 'Pago recibido',
    bodyTemplate: 'Pago de {{amount}} {{currency}} recibido exitosamente.',
  },
  [NotificationTemplateName.PAYMENT_FAILED]: {
    name: NotificationTemplateName.PAYMENT_FAILED,
    titleTemplate: 'Pago fallido',
    bodyTemplate: 'El pago de {{amount}} {{currency}} no pudo ser procesado. Por favor, intenta de nuevo.',
  },
};

export class NotificationTemplate {
  readonly name: NotificationTemplateName;
  readonly titleTemplate: string;
  readonly bodyTemplate: string;

  private constructor(props: NotificationTemplateProps) {
    this.name = props.name;
    this.titleTemplate = props.titleTemplate;
    this.bodyTemplate = props.bodyTemplate;
  }

  public static get(name: NotificationTemplateName): Result<NotificationTemplate, Error> {
    const template = TEMPLATES[name];
    if (!template) {
      return err(new Error(`Template "${name}" not found`));
    }
    return ok(new NotificationTemplate(template));
  }

  /**
   * Renders the template by replacing {{variable}} placeholders with actual values.
   */
  public render(variables: Record<string, string>): { title: string; body: string } {
    let title = this.titleTemplate;
    let body = this.bodyTemplate;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      body = body.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    return { title, body };
  }
}
