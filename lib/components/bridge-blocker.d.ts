/**
 * Monitor the active user limit (or any limit you desire),
 * and block the bridge when it's exceeded.
 *
 * Bridge blocking is represented by an `isBlocked` attribute,
 * and it's up to the implementation to decide what to do with that information.
 *
 * If a custom blocking/unblocking implementation is needed,
 * override `blockBridge()` and `unblockBridge()` respectively.
 * It's the caller's responsibility to call the base class methods
 * to flip the actual `isBlocked` flag. Any errors thrown in the custom implementations
 * get automatically caught (and logged) by `checkLimits()`
 *
 * @constructor
 * @param limit The upper user limit - the bridge gets blocked when it gets *exceeded* (not reached!)
 */
export declare class BridgeBlocker {
    private userLimit;
    _isBlocked: boolean;
    get isBlocked(): boolean;
    constructor(userLimit: number);
    /**
     * Check `users` param against the limit and block the bridge when it's exceeded.
     */
    checkLimits(users: number): Promise<void>;
    blockBridge(): Promise<void>;
    unblockBridge(): Promise<void>;
}
