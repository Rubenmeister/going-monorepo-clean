export declare abstract class BaseEntity<T> {
    protected readonly _id: string;
    protected readonly props: T;
    constructor(id: string, props: T);
    get id(): string;
    equals(object?: BaseEntity<T>): boolean;
}
