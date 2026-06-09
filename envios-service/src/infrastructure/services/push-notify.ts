import * as jwt from 'jsonwebtoken';

/**
 * Envía un push S2S a notifications-service. Firma un JWT de rol 'system'
 * (con JWT_SECRET, compartido por todos los servicios) y llama al endpoint real
 * POST /notifications/send — que persiste la notificación Y la empuja por FCM.
 *
 * Fire-and-forget: nunca lanza. Si falta JWT_SECRET o userId, no hace nada.
 */
export async function pushNotify(params: {
  userId?: string;
  title: string;
  body: string;
}): Promise<void> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || !params.userId) return;
    const notifUrl =
      process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005';
    const token = jwt.sign(
      { sub: 'system', role: 'system', roles: ['system'], source: 'svc-push' },
      secret,
      { expiresIn: '5m' },
    );
    await fetch(`${notifUrl}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: params.userId,
        channel: 'PUSH',
        title: params.title,
        body: params.body,
      }),
    });
  } catch {
    /* fire-and-forget */
  }
}
