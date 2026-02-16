import { Money } from '@going-monorepo-clean/shared-domain';

describe('Money Value Object', () => {
  it('should create a valid Money', () => {
    const result = Money.create(5000, 'USD');
    expect(result.isOk()).toBe(true);
    const money = result._unsafeUnwrap();
    expect(money.amount).toBe(5000);
    expect(money.currency).toBe('USD');
  });

  it('should accept lowercase currency', () => {
    const result = Money.create(100, 'usd');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().currency).toBe('USD');
  });

  it('should reject negative amount', () => {
    const result = Money.create(-1, 'USD');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('negative');
  });

  it('should reject non-integer amount', () => {
    const result = Money.create(10.5, 'USD');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('cents');
  });

  it('should reject invalid currency', () => {
    const result = Money.create(100, 'EUR');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('currency');
  });

  it('should report isPositive correctly', () => {
    const positive = Money.fromPrimitives({ amount: 100, currency: 'USD' });
    const zero = Money.fromPrimitives({ amount: 0, currency: 'USD' });
    expect(positive.isPositive()).toBe(true);
    expect(zero.isPositive()).toBe(false);
  });

  it('should serialize/deserialize with toPrimitives/fromPrimitives', () => {
    const money = Money.create(3000, 'USD')._unsafeUnwrap();
    const primitives = money.toPrimitives();
    expect(primitives).toEqual({ amount: 3000, currency: 'USD' });
    const restored = Money.fromPrimitives(primitives);
    expect(restored.amount).toBe(3000);
    expect(restored.currency).toBe('USD');
  });
});
