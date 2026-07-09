/**
 * Caches requests in memory and handles expiring them.
 */
export declare class ClientRequestCache<T, P extends Array<unknown>> {
    private readonly ttl;
    private readonly maxSize;
    private readonly requestFunc;
    private requestContent;
    /**
     * @param ttl How old a result can be before it gets expired.
     * @param size How many results to store before we trim.
     * @param requestFunc The function to use on cache miss.
     */
    constructor(ttl: number, maxSize: number, requestFunc: (key: string, ...args: P) => Promise<T>);
    invalidate(key: string): void;
    /**
     * Gets a result of a request from the cache, or otherwise
     * tries to fetch the the result with this.requestFunc
     *
     * @param key Key of the item to get/store.
     * @param args A set of arguments to pass to the request func.
     * @returns {Promise} The request, or undefined if not retrievable.
     * @throws {Error} If the key is not a string.
     */
    get(key: string, ...args: P): T | Promise<T>;
    /**
     * Clone the current request result cache, mapping keys to their cache records.
     * @returns {Map<string,any>}
     */
    getCachedResults(): Map<string, {
        ts: number;
        content: T;
    }>;
}
