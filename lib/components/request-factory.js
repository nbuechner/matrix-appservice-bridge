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
exports.RequestFactory = void 0;
const request_1 = require("./request");
/**
 * A factory which can create {@link Request} objects. Useful for
 * adding "default" handlers to requests.
 */
class RequestFactory {
    _resolves = [];
    _rejects = [];
    _timeouts = [];
    timeoutHandles = new Set();
    /**
     * Generate a new request.
     * @param opts The options to pass to the Request constructor, if any.
     * @return A new request object
     */
    newRequest(opts) {
        const req = new request_1.Request(opts || { data: null });
        req.getPromise().then((res) => {
            this._resolves.forEach((resolveFn) => {
                resolveFn(req, res);
            });
        }).catch((err) => {
            this._rejects.forEach((rejectFn) => {
                rejectFn(req, err);
            });
        });
        this._timeouts.forEach((timeoutObj) => {
            const timer = setTimeout(() => {
                this.timeoutHandles.delete(timer);
                if (!req.isPending) {
                    return;
                }
                timeoutObj.fn(req);
            }, timeoutObj.timeout);
            this.timeoutHandles.add(timer);
        });
        return req;
    }
    /**
     * Add a function which will be invoked for every request that is resolved.
     * @param fn The function to invoke. The first argument will be the
     * Request object, the second will be the resolve argument.
     */
    addDefaultResolveCallback(fn) {
        this._resolves.push(fn);
    }
    /**
     * Add a function which will be invoked for every request that is rejected.
     * @param fn The function to invoke. The first argument will be the
     * Request object, the second will be the rejection argument.
     */
    addDefaultRejectCallback(fn) {
        this._rejects.push(fn);
    }
    /**
     * Add a function which will be invoked for every request that has not been
     * resolved or rejected within a certain amount of time.
     * @param fn The function to invoke. The first argument will be the
     * Request object.
     * @param durationMs The number of milliseconds to wait for a
     * resolution to the request.
     */
    addDefaultTimeoutCallback(fn, durationMs) {
        this._timeouts.push({
            fn: fn,
            timeout: durationMs
        });
    }
    close() {
        this.timeoutHandles.forEach(t => clearTimeout(t));
    }
}
exports.RequestFactory = RequestFactory;
//# sourceMappingURL=request-factory.js.map