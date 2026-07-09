"use strict";
/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable = void 0;
let isFirstUseOfWrap = true;
var unstable;
(function (unstable) {
    /**
     * Append the old error message to the new one and keep its stack trace.
     * Example:
     *     throw wrapError(e, HighLevelError, "This error is more specific");
     */
    function wrapError(oldError, newErrorType, message = "") {
        const newError = new newErrorType(message);
        let appendMsg;
        if (oldError instanceof Error) {
            appendMsg = oldError.message;
            newError.stack = oldError.stack;
        }
        else {
            appendMsg = String(oldError);
        }
        newError.message += ":\n" + appendMsg;
        return newError;
    }
    unstable.wrapError = wrapError;
    /**
    * @deprecated Use {@link wrapError}
    */
    function wrap(oldError, newErrorType, message) {
        if (isFirstUseOfWrap) {
            console.warn("matrix-appservice-bridge: Use of `unstable.wrap` is deprecated. Please use `unstable.wrapError`.");
            isFirstUseOfWrap = false;
        }
        return wrapError(oldError, newErrorType, message);
    }
    unstable.wrap = wrap;
    /**
     * Base Error for when the bride can not handle the event.
     */
    class EventNotHandledError extends Error {
        internalReason;
        constructor(message = "The event could not be handled by the bridge") {
            super(message);
            this.name = "EventNotHandledError";
            this.internalReason = "m.event_not_handled";
        }
        get reason() {
            return this.internalReason;
        }
    }
    unstable.EventNotHandledError = EventNotHandledError;
    /**
     * The bridge decides that the event is too old to be sent.
     */
    class EventTooOldError extends EventNotHandledError {
        constructor(message = "The event was too old to be handled by the bridge") {
            super(message);
            this.name = "EventTooOldError";
            this.internalReason = "m.event_too_old";
        }
    }
    unstable.EventTooOldError = EventTooOldError;
    /**
     * An unexpected internal error occured while the bridge handled the event.
     */
    class BridgeInternalError extends EventNotHandledError {
        constructor(message = "The bridge experienced an internal error") {
            super(message);
            this.name = "EventTooOldError";
            this.internalReason = "m.internal_error";
        }
    }
    unstable.BridgeInternalError = BridgeInternalError;
    /**
     * The foreign network errored and the event couldn't be delivered.
     */
    class ForeignNetworkError extends EventNotHandledError {
        constructor(message = "The foreign network experienced an error") {
            super(message);
            this.name = "ForeignNetworkError";
            this.internalReason = "m.foreign_network_error";
        }
    }
    unstable.ForeignNetworkError = ForeignNetworkError;
    /**
     * The event is not understood by the bridge.
     */
    class EventUnknownError extends EventNotHandledError {
        constructor(message = "The event is not known to the bridge") {
            super(message);
            this.name = "EventUnknownError";
            this.internalReason = "m.event_unknown";
        }
    }
    unstable.EventUnknownError = EventUnknownError;
})(unstable || (exports.unstable = unstable = {}));
//# sourceMappingURL=errors.js.map