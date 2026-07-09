"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.ErrCode = void 0;
var ErrCode;
(function (ErrCode) {
    // Errors are prefixed with M_AS_
    /**
     * Generic failure, unknown reason
     */
    ErrCode["Unknown"] = "M_AS_UNKNOWN";
    /**
     * The operation was not supported by this connection
     */
    ErrCode["UnsupportedOperation"] = "M_AS_UNSUPPORTED_OPERATION";
    /**
     * A bad value was given to the API.
     */
    ErrCode["BadValue"] = "M_AS_BAD_VALUE";
    /**
     * The secret token provided to the API was invalid or not given.
     */
    ErrCode["BadToken"] = "M_AS_BAD_TOKEN";
    /**
     * The requested feature is not enabled in the bridge.
     */
    ErrCode["DisabledFeature"] = "M_AS_DISABLED_FEATURE";
    /**
     * Couldn't complete the openId process.
     */
    ErrCode["BadOpenID"] = "M_AS_BAD_OPENID";
    /**
     * The request was denied due to ratelimiting rules.
     */
    ErrCode["Ratelimited"] = "M_AS_LIMIT_EXCEEDED";
    /**
     * The item that was requested could not be found.
     */
    ErrCode["NotFound"] = "M_NOT_FOUND";
})(ErrCode || (exports.ErrCode = ErrCode = {}));
const ErrCodeToStatusCode = {
    M_NOT_FOUND: 404,
    M_AS_UNKNOWN: 500,
    M_AS_UNSUPPORTED_OPERATION: 400,
    M_AS_BAD_VALUE: 400,
    M_AS_BAD_TOKEN: 401,
    M_AS_DISABLED_FEATURE: 500,
    M_AS_BAD_OPENID: 500,
    M_AS_LIMIT_EXCEEDED: 429,
};
class ApiError extends Error {
    error;
    errcode;
    statusCode;
    additionalContent;
    constructor(error, errcode = ErrCode.Unknown, statusCode = -1, additionalContent = {}) {
        super(`API error ${errcode}: ${error}`);
        this.error = error;
        this.errcode = errcode;
        this.statusCode = statusCode;
        this.additionalContent = additionalContent;
        if (statusCode === -1) {
            this.statusCode = ErrCodeToStatusCode[errcode];
        }
    }
    get jsonBody() {
        return {
            errcode: this.errcode,
            error: this.error,
            ...this.additionalContent,
        };
    }
    apply(response) {
        response.status(this.statusCode).send(this.jsonBody);
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=errors.js.map