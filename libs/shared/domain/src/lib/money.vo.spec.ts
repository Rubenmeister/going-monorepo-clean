import { Money } from './money.vo';

describe('Money Value Object', () => {
  it('should create money from primitives', () => {
    const money = Money.fromPrimitives({ amount: 100, currency: 'USD' });
    expect(money.amount).toBe(100);
    expect(money.currency).toBe('USD');
  });

  it('should create money via create method', () => {
    const moneyResult = Money.create(5000, 'USD');
    expect(moneyResult.isOk()).toBe(true);
    const money = moneyResult._unsafeUnwrap();
    expect(money.amount).toBe(5000);
    expect(money.currency).toBe('USD');
  });

  it('should return error for negative amount', () => {
    const moneyResult = Money.create(-1, 'USD');
    expect(moneyResult.isErr()).toBe(true);
    expect(moneyResult._unsafeUnwrapErr().message).toBe('Amount cannot be negative');
  });

  it('should convert to primitives', () => {
    const money = Money.fromPrimitives({ amount: 2000, currency: 'USD' });
    expect(money.toPrimitives()).toEqual({ amount: 2000, currency: 'USD' });
  });
});
