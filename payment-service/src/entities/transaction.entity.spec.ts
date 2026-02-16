import { Transaction } from '@going-monorepo-clean/domains-payment-core';
import { Money } from '@going-monorepo-clean/shared-domain';

describe('Transaction Entity', () => {
  const validProps = {
    userId: 'user-1',
    referenceId: 'trip-1',
    amount: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
  };

  it('should create a valid transaction', () => {
    const result = Transaction.create(validProps);
    expect(result.isOk()).toBe(true);
    const tx = result._unsafeUnwrap();
    expect(tx.status).toBe('pending');
    expect(tx.userId).toBe('user-1');
    expect(tx.id).toBeDefined();
  });

  it('should reject non-positive amount', () => {
    const result = Transaction.create({
      ...validProps,
      amount: Money.fromPrimitives({ amount: 0, currency: 'USD' }),
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('positive');
  });

  it('should set payment intent', () => {
    const tx = Transaction.create(validProps)._unsafeUnwrap();
    tx.setPaymentIntent('pi_123456');
    expect(tx.paymentIntentId).toBe('pi_123456');
  });

  it('should succeed a pending transaction', () => {
    const tx = Transaction.create(validProps)._unsafeUnwrap();
    tx.succeed();
    expect(tx.status).toBe('succeeded');
  });

  it('should fail a pending transaction', () => {
    const tx = Transaction.create(validProps)._unsafeUnwrap();
    tx.fail();
    expect(tx.status).toBe('failed');
  });

  it('should not succeed a non-pending transaction', () => {
    const tx = Transaction.create(validProps)._unsafeUnwrap();
    tx.fail();
    tx.succeed(); // should be no-op
    expect(tx.status).toBe('failed');
  });

  it('should serialize/deserialize', () => {
    const tx = Transaction.create(validProps)._unsafeUnwrap();
    tx.setPaymentIntent('pi_abc');
    const primitives = tx.toPrimitives();
    expect(primitives.paymentIntentId).toBe('pi_abc');
    const restored = Transaction.fromPrimitives(primitives);
    expect(restored.userId).toBe('user-1');
  });
});
