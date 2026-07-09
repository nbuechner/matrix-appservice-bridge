export declare namespace unstable {
    type BridgeErrorReason = "m.event_not_handled" | "m.event_too_old" | "m.internal_error" | "m.foreign_network_error" | "m.event_unknown";
    /**
     * Append the old error message to the new one and keep its stack trace.
     * Example:
     *     throw wrapError(e, HighLevelError, "This error is more specific");
     */
    function wrapError<T extends EventNotHandledError>(oldError: unknown, newErrorType: {
        new (message: string): T;
    }, message?: string): EventNotHandledError;
    /**
    * @deprecated Use {@link wrapError}
    */
    function wrap<T extends EventNotHandledError>(oldError: Error | string, newErrorType: {
        new (message: string): T;
    }, message?: string): EventNotHandledError;
    /**
     * Base Error for when the bride can not handle the event.
     */
    class EventNotHandledError extends Error {
        protected internalReason: BridgeErrorReason;
        constructor(message?: string);
        get reason(): BridgeErrorReason;
    }
    /**
     * The bridge decides that the event is too old to be sent.
     */
    class EventTooOldError extends EventNotHandledError {
        constructor(message?: string);
    }
    /**
     * An unexpected internal error occured while the bridge handled the event.
     */
    class BridgeInternalError extends EventNotHandledError {
        constructor(message?: string);
    }
    /**
     * The foreign network errored and the event couldn't be delivered.
     */
    class ForeignNetworkError extends EventNotHandledError {
        constructor(message?: string);
    }
    /**
     * The event is not understood by the bridge.
     */
    class EventUnknownError extends EventNotHandledError {
        constructor(message?: string);
    }
}
