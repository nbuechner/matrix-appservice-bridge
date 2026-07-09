import { Request, RequestOpts } from "./request";
type HandlerFunction = (req: Request<unknown>, value: unknown) => Promise<unknown> | unknown;
type TimeoutFunction = (req: Request<unknown>) => void;
/**
 * A factory which can create {@link Request} objects. Useful for
 * adding "default" handlers to requests.
 */
export declare class RequestFactory {
    private _resolves;
    private _rejects;
    private _timeouts;
    private timeoutHandles;
    /**
     * Generate a new request.
     * @param opts The options to pass to the Request constructor, if any.
     * @return A new request object
     */
    newRequest<T>(opts?: RequestOpts<T>): Request<T | null>;
    /**
     * Add a function which will be invoked for every request that is resolved.
     * @param fn The function to invoke. The first argument will be the
     * Request object, the second will be the resolve argument.
     */
    addDefaultResolveCallback(fn: HandlerFunction): void;
    /**
     * Add a function which will be invoked for every request that is rejected.
     * @param fn The function to invoke. The first argument will be the
     * Request object, the second will be the rejection argument.
     */
    addDefaultRejectCallback(fn: HandlerFunction): void;
    /**
     * Add a function which will be invoked for every request that has not been
     * resolved or rejected within a certain amount of time.
     * @param fn The function to invoke. The first argument will be the
     * Request object.
     * @param durationMs The number of milliseconds to wait for a
     * resolution to the request.
     */
    addDefaultTimeoutCallback(fn: TimeoutFunction, durationMs: number): void;
    close(): void;
}
export {};
