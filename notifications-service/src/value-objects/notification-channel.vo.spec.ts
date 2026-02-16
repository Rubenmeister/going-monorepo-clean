import { NotificationChannel } from '@going-monorepo-clean/domains-notification-core';

describe('NotificationChannel Value Object', () => {
  it('should create PUSH channel', () => {
    const result = NotificationChannel.create('PUSH');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().value).toBe('PUSH');
  });

  it('should create EMAIL channel', () => {
    const result = NotificationChannel.create('EMAIL');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().value).toBe('EMAIL');
  });

  it('should create SMS channel', () => {
    const result = NotificationChannel.create('SMS');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().value).toBe('SMS');
  });

  it('should accept lowercase input', () => {
    const result = NotificationChannel.create('push');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().value).toBe('PUSH');
  });

  it('should reject invalid channel', () => {
    const result = NotificationChannel.create('TELEGRAM');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Invalid');
  });

  it('should serialize/deserialize', () => {
    const channel = NotificationChannel.create('EMAIL')._unsafeUnwrap();
    const primitive = channel.toPrimitives();
    expect(primitive).toBe('EMAIL');
    const restored = NotificationChannel.fromPrimitives(primitive);
    expect(restored.value).toBe('EMAIL');
  });
});
