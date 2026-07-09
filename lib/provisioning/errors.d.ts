import { Response } from "express";
export declare enum ErrCode {
    /**
     * Generic failure, unknown reason
     */
    Unknown = "M_AS_UNKNOWN",
    /**
     * The operation was not supported by this connection
     */
    UnsupportedOperation = "M_AS_UNSUPPORTED_OPERATION",
    /**
     * A bad value was given to the API.
     */
    BadValue = "M_AS_BAD_VALUE",
    /**
     * The secret token provided to the API was invalid or not given.
     */
    BadToken = "M_AS_BAD_TOKEN",
    /**
     * The requested feature is not enabled in the bridge.
     */
    DisabledFeature = "M_AS_DISABLED_FEATURE",
    /**
     * Couldn't complete the openId process.
     */
    BadOpenID = "M_AS_BAD_OPENID",
    /**
     * The request was denied due to ratelimiting rules.
     */
    Ratelimited = "M_AS_LIMIT_EXCEEDED",
    /**
     * The item that was requested could not be found.
     */
    NotFound = "M_NOT_FOUND"
}
export interface IApiError {
    readonly error: string;
    readonly errcode: string;
    readonly statusCode: number;
    apply(response: Response): void;
}
export declare class ApiError extends Error implements IApiError {
    readonly error: string;
    readonly errcode: ErrCode;
    readonly statusCode: number;
    readonly additionalContent: Record<string, unknown>;
    constructor(error: string, errcode?: ErrCode, statusCode?: number, additionalContent?: Record<string, unknown>);
    get jsonBody(): {
        errcode: string;
        error: string;
    };
    apply(response: Response): void;
}
