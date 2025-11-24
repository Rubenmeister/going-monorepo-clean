import { Result } from 'neverthrow';
export type Currency = 'USD';
export interface MoneyProps {
    amount: number;
    currency: Currency;
}
export declare class Money {
    readonly amount: number;
    readonly currency: Currency;
    private constructor();
    static create(amount: number, currency: string): Result<Money, Error>;
    isPositive(): boolean;
    toPrimitives(): MoneyProps;
    static fromPrimitives(props: MoneyProps): Money;
}
