"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisioningApi = exports.DefaultDisallowedIpRanges = void 0;
const express_1 = __importStar(require("express"));
const _1 = require(".");
const url_1 = require("url");
const matrix_host_resolver_1 = require("../utils/matrix-host-resolver");
const net_1 = require("net");
const dns_1 = require("dns");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const __1 = require("..");
const crypto_1 = require("crypto");
const ip_cidr_1 = __importDefault(require("ip-cidr"));
// Borrowed from
// https://github.com/matrix-org/synapse/blob/91221b696156e9f1f9deecd425ae58af03ebb5d3/docs/sample_config.yaml#L215
exports.DefaultDisallowedIpRanges = [
    '127.0.0.0/8',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '100.64.0.0/10',
    '192.0.0.0/24',
    '169.254.0.0/16',
    '192.88.99.0/24',
    '198.18.0.0/15',
    '192.0.2.0/24',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '224.0.0.0/4',
    '::1/128',
    'fe80::/10',
    'fc00::/7',
    '2001:db8::/32',
    'ff00::/8',
    'fec0::/10'
];
const log = new __1.Logger("ProvisioningApi");
const DEFAULT_WIDGET_TOKEN_PREFIX = "br-sdk-utoken-";
const DEFAULT_WIDGET_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // One day
/**
 * The provisioning API serves two classes of clients:
 *  - Integration managers which provide a unique secret token, and a userId
 *  - Widget users which provide a openId token.
 */
class ProvisioningApi {
    store;
    opts;
    app;
    server;
    baseRoute;
    widgetTokenPrefix;
    widgetTokenLifetimeMs;
    wellknown = new matrix_host_resolver_1.MatrixHostResolver();
    allowedIpRanges;
    disallowedIpRanges;
    constructor(store, opts = {}) {
        this.store = store;
        this.opts = opts;
        this.app = (0, express_1.default)();
        this.app.use((req, _res, next) => {
            log.info(`${req.method} ${req.path} ${req.ip || ''} ${req.headers["user-agent"] || ''}`);
            next();
        });
        this.widgetTokenPrefix = opts.widgetTokenPrefix || DEFAULT_WIDGET_TOKEN_PREFIX;
        this.widgetTokenLifetimeMs = opts.widgetTokenLifetimeMs || DEFAULT_WIDGET_TOKEN_LIFETIME_MS;
        this.opts.apiPrefix = opts.apiPrefix || "/provisioning";
        this.allowedIpRanges = (opts.allowedIpRanges || []).map(ip => new ip_cidr_1.default(ip));
        this.disallowedIpRanges = (opts.disallowedIpRanges || exports.DefaultDisallowedIpRanges).map(ip => new ip_cidr_1.default(ip));
        this.app.get('/health', this.getHealth.bind(this));
        const limiter = this.opts.ratelimit && (0, express_rate_limit_1.default)({
            handler: (req, _res, next, options) => {
                next(new _1.ApiError("Too many requests", _1.ErrCode.Ratelimited, 429, {
                    retry_after_ms: options.windowMs,
                }));
            },
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 30, // Limit per window
            standardHeaders: true,
            legacyHeaders: false,
            ...(typeof this.opts.ratelimit === "object" ? this.opts.ratelimit : {})
        });
        this.baseRoute = (0, express_1.Router)();
        if (opts.widgetFrontendLocation) {
            this.baseRoute.use('/v1/static', express_1.default.static(opts.widgetFrontendLocation));
        }
        if (limiter) {
            this.baseRoute.use(limiter);
        }
        this.baseRoute.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            next();
        });
        this.baseRoute.use(express_1.default.json());
        // Unsecured requests
        this.baseRoute.post(`/v1/exchange_openid`, (req, res, next) => this.postExchangeOpenId(req, res).catch(ex => next(ex)));
        // Secure requests
        // addRoute ensures all successful requests are of type ProvisioningRequest
        this.baseRoute.use((req, res, next) => this.authenticateRequest(req, res, next).catch(ex => next([ex, req])));
        this.addRoute("get", "/v1/session", this.getSession.bind(this));
        this.addRoute("delete", "/v1/session", this.deleteSession.bind(this));
        this.addRoute("delete", "/v1/session/all", this.deleteAllSessions.bind(this));
        this.baseRoute.use(this.onError);
        if (this.opts.expressApp) {
            this.opts.expressApp.use(this.opts.apiPrefix, this.baseRoute);
        }
        else {
            this.app.use(this.opts.apiPrefix, this.baseRoute);
        }
    }
    async start(port, hostname = "0.0.0.0", backlog = 10) {
        if (this.opts.expressApp) {
            log.warn(`Ignoring call to start(), api configured to use parent express app`);
            return undefined;
        }
        return new Promise((res) => {
            this.server = this.app.listen(port, hostname, backlog, () => res());
            log.info(`Widget API listening on port ${port}`);
        });
    }
    close() {
        return new Promise((res, rej) => this.server?.close(e => e ? rej(e) : res()));
    }
    addRoute(method, path, handler, fnName) {
        this.baseRoute[method](path, async (req, res, next) => {
            const expRequest = req;
            const provisioningRequest = new _1.ProvisioningRequest(expRequest, expRequest.matrixUserId, expRequest.matrixWidgetToken ? "widget" : "provisioner", expRequest.matrixWidgetToken, fnName);
            try {
                await handler(provisioningRequest, res, next);
            }
            catch (ex) {
                // Pass to error handler.
                next([ex, provisioningRequest]);
            }
            // Always add an error handler
        }, this.onError);
    }
    async authenticateRequest(
    // Historically, user_id has been used. The bridge library supports either.
    // eslint-disable-next-line camelcase
    req, res, next) {
        const authHeader = req.header("Authorization");
        if (!authHeader) {
            throw new _1.ApiError('No Authorization header', _1.ErrCode.BadToken);
        }
        const token = authHeader.replace("Bearer ", "").replace("bearer ", "");
        if (!token) {
            throw new _1.ApiError('Invalid Authorization header format', _1.ErrCode.BadToken);
        }
        const requestProv = req;
        if (!this.opts.provisioningToken && req.body.userId) {
            throw new _1.ApiError('Provisioning feature disabled', _1.ErrCode.DisabledFeature);
        }
        if (token === this.opts.provisioningToken) {
            // Integration managers splice in the user_id in the body.
            // Sometimes it's not required though.
            requestProv.matrixUserId = req.body?.userId || req.body?.user_id || null;
            requestProv.matrixWidgetToken = undefined;
            next();
            return;
        }
        const session = await this.store.getSessionForToken(token);
        if (!session) {
            throw new _1.ApiError('Token not found', _1.ErrCode.BadToken);
        }
        if (session.expiresTs < Date.now()) {
            await this.store.deleteSession(token);
            throw new _1.ApiError('Token expired', _1.ErrCode.BadToken);
        }
        requestProv.matrixUserId = session.userId;
        requestProv.matrixWidgetToken = token;
        next();
    }
    getHealth(req, res) {
        res.send({ ok: true });
    }
    getSession(req, res) {
        res.send({
            userId: req.userId,
            type: req.requestSource,
        });
    }
    async deleteSession(req, res) {
        if (!req.widgetToken) {
            req.log.debug("tried to delete non-existent session");
            throw new _1.ApiError("Session cannot be deleted", _1.ErrCode.UnsupportedOperation);
        }
        try {
            await this.store.deleteSession(req.widgetToken);
        }
        catch (ex) {
            req.log.error("Failed to delete session", ex);
            throw new _1.ApiError("Session could not be deleted", _1.ErrCode.Unknown);
        }
        res.send({ ok: true });
    }
    async deleteAllSessions(req, res) {
        if (!req.widgetToken) {
            req.log.debug("tried to delete non-existent session");
            throw new _1.ApiError("Session cannot be deleted", _1.ErrCode.UnsupportedOperation);
        }
        if (!req.userId) {
            throw new _1.ApiError("");
        }
        try {
            await this.store.deleteAllSessions(req.userId);
        }
        catch (ex) {
            req.log.error("Failed to delete all sessions", ex);
            throw new _1.ApiError("Sessions could not be deleted", _1.ErrCode.Unknown);
        }
        res.send({ ok: true });
    }
    async checkIpBlacklist(url) {
        const host = url.hostname;
        let ip;
        if ((0, net_1.isIP)(host)) {
            ip = host;
        }
        else {
            const record = await dns_1.promises.lookup(host);
            ip = record.address;
        }
        if (this.allowedIpRanges.find(d => d.contains(ip))) {
            return;
        }
        if (this.disallowedIpRanges.find(d => d.contains(ip))) {
            throw new _1.ApiError('Server is disallowed', _1.ErrCode.BadOpenID);
        }
    }
    async postExchangeOpenId(req, res) {
        const server = req.body?.matrixServer;
        const openIdToken = req.body?.openIdToken;
        if (typeof server !== "string") {
            throw new _1.ApiError("Missing/invalid matrixServer in body", _1.ErrCode.BadValue);
        }
        if (typeof openIdToken !== "string") {
            throw new _1.ApiError("Missing/invalid openIdToken in body", _1.ErrCode.BadValue);
        }
        let url;
        let hostHeader;
        try {
            const overrideUrl = this.opts.openIdOverride?.[server];
            if (overrideUrl) {
                url = overrideUrl;
                hostHeader = server;
            }
            else {
                const urlRes = await this.wellknown.resolveMatrixServer(server);
                hostHeader = urlRes.hostHeader;
                url = urlRes.url;
                await this.checkIpBlacklist(url);
            }
        }
        catch (ex) {
            log.warn(`Failed to fetch the server URL for ${server}`, ex);
            throw new _1.ApiError("Could not identify server url", _1.ErrCode.BadOpenID);
        }
        // Now do the token exchange
        try {
            const requestUrl = new url_1.URL("/_matrix/federation/v1/openid/userinfo", url);
            requestUrl.searchParams.set('access_token', openIdToken);
            const response = await fetch(requestUrl, {
                headers: {
                    'Host': hostHeader,
                }
            });
            if (!response.ok) {
                log.warn(`Server responded with a status of ${response.status}`);
                log.debug(`Server response:`, await response.text());
                throw new _1.ApiError("Server did not respond positively to request", _1.ErrCode.BadOpenID);
            }
            const data = await response.json();
            if (!data.sub) {
                log.warn(`Server responded with invalid sub information for ${server}`, data);
                throw new _1.ApiError("Server did not respond with the correct sub information", _1.ErrCode.BadOpenID);
            }
            const userId = data.sub;
            const mxidMatch = userId.match(/([^:]+):(.+)/);
            if (!mxidMatch) {
                throw new _1.ApiError("Server did not respond with a valid MXID", _1.ErrCode.BadOpenID);
            }
            const [, , serverName] = mxidMatch;
            if (serverName !== server) {
                throw new _1.ApiError("Server returned a MXID belonging to another homeserver", _1.ErrCode.BadOpenID);
            }
            const token = this.widgetTokenPrefix + (0, crypto_1.randomUUID)().replace(/-/g, "");
            const expiresTs = Date.now() + this.widgetTokenLifetimeMs;
            await this.store.createSession({
                userId,
                token,
                expiresTs,
            });
            res.send({ token, userId });
        }
        catch (ex) {
            log.warn(`Failed to exchange the token for ${server}`, ex);
            if (ex instanceof _1.ApiError) {
                throw ex;
            }
            else {
                throw new _1.ApiError("Failed to exchange token", _1.ErrCode.BadOpenID);
            }
        }
    }
    // Needed so that _next can be defined in order to preserve signature.
    onError(err, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _req, res, _next) {
        if (!err) {
            return;
        }
        const [error, request] = Array.isArray(err) ? err : [err, undefined];
        if (request instanceof _1.ProvisioningRequest) {
            request.log.error(error);
        }
        else {
            log.error(error);
        }
        if (res.headersSent) {
            return;
        }
        if ("apply" in error && typeof error.apply === "function") {
            error.apply(res);
        }
        else {
            new _1.ApiError("An internal error occured").apply(res);
        }
    }
}
exports.ProvisioningApi = ProvisioningApi;
//# sourceMappingURL=api.js.map