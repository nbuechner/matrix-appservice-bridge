export interface RequestOpts<T> {
    id?: string;
    data: T;
}
export declare class Request<T> {
    private id;
    private data;
    private startTs;
    private defer;
    private pending;
    get isPending(): boolean;
    /**
     * Construct a new Request.
     * @param opts Options for this request.
     * @param opts.id Optional ID to set on this request. One will be
     * generated if this is not provided.
     * @param opts.data Optional data to associate with this request.
     */
    constructor(opts: RequestOpts<T>);
    /**
     * Get any optional data set on this request.
     * @return The data
     */
    getData(): T;
    /**
     * Get this request's ID.
     * @return The ID.
     */
    getId(): string;
    /**
     * Get the number of elapsed milliseconds since this request was created.
     * @return The number of milliseconds since this request was made.
     */
    getDuration(): number;
    /**
     * Retrieve a promise for this request which will be resolved/rejected when the
     * respective methods are called on this Request.
     * @return {Promise} A promise
     */
    getPromise(): Promise<unknown>;
    /**
     * Resolve a request. This should be invoked for the <i>successful processing</i>
     * of this request. This doesn't necessarily mean that the request was sent
     * through, e.g. suppressing AS virtual users' messages is still a success.
     * @param msg The thing to resolve with.
     */
    resolve(msg: unknown): void;
    /**
     * Reject a request. This should be invoked for requests which <i>failed to be
     * processed correctly</i>.
     * @param msg The thing to reject with.
     */
    reject(msg: unknown): void;
    /**
     * Resolve or reject the promise depending on the outcome of this promise.
     * @param promise The promise whose resolution determines the outcome of this
     * request.
     */
    outcomeFrom(promise: Promise<unknown>): Promise<void>;
}
