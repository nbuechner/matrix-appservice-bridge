export interface Defer<T> {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (err?: unknown) => void;
    promise: Promise<T>;
}
export declare function defer<T>(): Defer<T>;
export declare function delay(delayMs: number): Promise<unknown>;
