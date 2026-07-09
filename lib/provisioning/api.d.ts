import { Application, NextFunction, Request, Response, Router } from "express";
import { ProvisioningStore } from "./store";
import { IApiError, ProvisioningRequest } from ".";
import { URL } from "url";
import { Options as RatelimitOptions } from "express-rate-limit";
import { Methods } from "./request";
export declare const DefaultDisallowedIpRanges: string[];
export interface ExchangeOpenAPIRequestBody {
    openIdToken: string;
    matrixServer: string;
}
export interface ExchangeOpenAPIResponseBody {
    token: string;
    userId: string;
}
export interface ProvisioningApiOpts {
    /**
     * A set of Matrix server names to override the well known response to. Should
     * only be used for testing.
     */
    openIdOverride?: {
        [serverName: string]: URL;
    };
    /**
     * Allow these IP ranges to be hit when handling OpenID requests even if they are within
     * `disallowedIpRanges`. This allows specific sub-ranges of `disallowedIpRanges` to be
     * used without having to carefully construct the ranges that still should be disallowed.
     *
     * If the IP the OpenID request would be made to isn't in either list it is implicitly allowed.
     *
     * Defaults to the empty list.
     */
    allowedIpRanges?: string[];
    /**
     * Disallow these IP ranges from being hit when handling OpenID requests. By default, a number of
     * intenal ranges are blocked.
     * @see DefaultDisallowedIpRanges
     */
    disallowedIpRanges?: string[];
    /**
     * Secret token for provisioning requests
     */
    provisioningToken?: string;
    /**
     * For widget tokens, use this prefix.
     */
    widgetTokenPrefix?: string;
    /**
     * How long should a widget token last for?
     */
    widgetTokenLifetimeMs?: number;
    /**
     * Where are the files stored for the widget frontend. If undefined, do not host a frontend.
     */
    widgetFrontendLocation?: string;
    /**
     * Provide an existing express app to bind to.
     *
     * Note: start() and close() will no-op when this is used.
     */
    expressApp?: Application;
    /**
     * Prefix to use for the API. E.g. `/api` in `/api/v1/session`
     *
     * Default is `/api`.
     */
    apiPrefix?: string;
    /**
     * Options for ratelimiting requests to the api server. Does not affect
     * static content loading.
     */
    ratelimit?: boolean | Partial<RatelimitOptions>;
}
/**
 * The provisioning API serves two classes of clients:
 *  - Integration managers which provide a unique secret token, and a userId
 *  - Widget users which provide a openId token.
 */
export declare class ProvisioningApi {
    protected store: ProvisioningStore;
    private opts;
    private app;
    private server?;
    protected baseRoute: Router;
    private readonly widgetTokenPrefix;
    private readonly widgetTokenLifetimeMs;
    private readonly wellknown;
    private readonly allowedIpRanges;
    private readonly disallowedIpRanges;
    constructor(store: ProvisioningStore, opts?: ProvisioningApiOpts);
    start(port: number, hostname?: string, backlog?: number): Promise<void>;
    close(): Promise<void>;
    addRoute(method: Methods, path: string, handler: (req: ProvisioningRequest, res: Response, next?: NextFunction) => void | Promise<void>, fnName?: string): void;
    private authenticateRequest;
    private getHealth;
    private getSession;
    private deleteSession;
    private deleteAllSessions;
    private checkIpBlacklist;
    private postExchangeOpenId;
    protected onError(err: [IApiError | Error, ProvisioningRequest | Request] | IApiError | Error, _req: Request, res: Response, _next: NextFunction): void;
}
