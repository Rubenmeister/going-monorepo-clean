import { Notification, NotificationChannel } from '@going-monorepo-clean/domains-notification-core';

describe('Notification Entity', () => {
  const channel = NotificationChannel.create('PUSH')._unsafeUnwrap();

  const validProps = {
    userId: 'user-1',
    channel,
    title: 'Viaje confirmado',
    body: 'Tu viaje a Cuenca sale mañana',
  };

  it('should create a valid notification', () => {
    const result = Notification.create(validProps);
    expect(result.isOk()).toBe(true);
    const notif = result._unsafeUnwrap();
    expect(notif.title).toBe('Viaje confirmado');
    expect(notif.status).toBe('PENDING');
    expect(notif.id).toBeDefined();
  });

  it('should reject empty title', () => {
    const result = Notification.create({ ...validProps, title: '' });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Title');
  });

  it('should reject empty body', () => {
    const result = Notification.create({ ...validProps, body: '' });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Body');
  });

  it('should mark as sent', () => {
    const notif = Notification.create(validProps)._unsafeUnwrap();
    const result = notif.markAsSent();
    expect(result.isOk()).toBe(true);
    expect(notif.status).toBe('SENT');
    expect(notif.sentAt).toBeDefined();
  });

  it('should not mark as sent if not pending', () => {
    const notif = Notification.create(validProps)._unsafeUnwrap();
    notif.markAsSent();
    const result = notif.markAsSent(); // already sent
    expect(result.isErr()).toBe(true);
  });

  it('should mark as read', () => {
    const notif = Notification.create(validProps)._unsafeUnwrap();
    notif.markAsSent();
    const result = notif.markAsRead();
    expect(result.isOk()).toBe(true);
    expect(notif.status).toBe('READ');
    expect(notif.readAt).toBeDefined();
  });

  it('should be idempotent when already read', () => {
    const notif = Notification.create(validProps)._unsafeUnwrap();
    notif.markAsRead();
    const result = notif.markAsRead();
    expect(result.isOk()).toBe(true);
  });

  it('should mark as failed', () => {
    const notif = Notification.create(validProps)._unsafeUnwrap();
    const result = notif.markAsFailed();
    expect(result.isOk()).toBe(true);
    expect(notif.status).toBe('FAILED');
  });

  it('should serialize/deserialize', () => {
    const notif = Notification.create(validProps)._unsafeUnwrap();
    const primitives = notif.toPrimitives();
    expect(primitives.channel).toBe('PUSH');
    const restored = Notification.fromPrimitives(primitives);
    expect(restored.title).toBe('Viaje confirmado');
  });
});
