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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaProxy = void 0;
const node_crypto_1 = require("node:crypto");
const express_1 = __importStar(require("express"));
const __1 = require("..");
const http_1 = require("http");
const https_1 = require("https");
const subtleCrypto = node_crypto_1.webcrypto.subtle;
const log = new __1.Logger('MediaProxy');
const ALGORITHM = { name: 'hmac', hash: {
        name: 'SHA-512'
    },
    length: 512,
};
/**
 * A media proxy class intended for bridges which share media to the
 * public internet.
 */
class MediaProxy {
    opts;
    matrixClient;
    internalRouter;
    /**
     * Only used if start() is called.
     */
    server;
    /**
     * Get the express router used for handling calls.
     */
    get router() {
        return this.internalRouter;
    }
    constructor(opts, matrixClient) {
        this.opts = opts;
        this.matrixClient = matrixClient;
        // eslint-disable-next-line new-cap
        this.internalRouter = (0, express_1.Router)();
        this.internalRouter.use((req, _res, next) => {
            log.info(`${req.method} ${req.path} ${req.ip || ''} ${req.headers["user-agent"] || ''}`);
            next();
        });
        this.internalRouter.get('/health', this.getHealth.bind(this));
        this.internalRouter.get('/v1/media/download/:mediaToken', (req, res, next) => this.onMediaRequest(req, res).catch(ex => next(ex)));
        this.internalRouter.use(this.onError);
    }
    async start(port, hostname = "0.0.0.0", backlog = 10) {
        const app = (0, express_1.default)();
        app.use(this.internalRouter);
        return new Promise((res) => {
            this.server = app.listen(port, hostname, backlog, () => res());
            log.info(`Media proxy API listening on port ${port}`);
        });
    }
    close() {
        return new Promise((res, rej) => this.server?.close(e => e ? rej(e) : res()));
    }
    async getMediaToken(metadata) {
        // V2 token format:
        // - At offset zero: a single byte, numeric int, indicating a token version.
        //   Version 0 is reserved for future use, for the remote possibility we run out of versions in an int8 :)
        // - At offset 1: the SHA-512 HMAC signature of the payload (64 bytes)
        // - At offset 65: MediaMetadata.endDt, encoded as a Big-Endian double (matching JS' `number` type).
        //   An undefined endDt is encoded as a -1. 8 bytes.
        // - At offset 73: the room ID the media was sent in (may be empty), NUL terminated.
        // - Following that: the event ID the media was sent in (may be empty), NUL terminated.
        // - Following that: the MXC of the media content, until the end of the buffer.
        // The payload, for the purpose of generating the signature,
        // is the byte-encoded endDt concatenated with the byte-encoded roomId, eventId and MXC.
        const version = Buffer.allocUnsafe(1);
        version.writeInt8(2);
        const dt = Buffer.allocUnsafe(8);
        dt.writeDoubleBE(metadata.endDt ?? -1);
        const nul = Buffer.from([0]);
        const roomIdBuf = Buffer.from(metadata.roomId ?? '');
        const eventIdBuf = Buffer.from(metadata.eventId ?? '');
        const mxcBuf = Buffer.from(metadata.mxc);
        const payload = Buffer.concat([dt, roomIdBuf, nul, eventIdBuf, nul, mxcBuf]);
        const sig = Buffer.from(await subtleCrypto.sign(ALGORITHM, this.opts.signingKey, payload));
        const token = Buffer.concat([version, sig, payload]);
        return token.toString('base64url');
    }
    async verifyMediaToken(token) {
        const buf = Buffer.from(token, 'base64url');
        let cursor = 0;
        const version = buf.readInt8(cursor++);
        if (version !== 1 && version !== 2) {
            throw new __1.ApiError(`Unrecognized version of media token (${version})`, __1.ErrCode.BadValue);
        }
        const sig = buf.subarray(cursor, cursor += 64);
        const dtBuf = buf.subarray(cursor, cursor += 8);
        const payload = buf.subarray(cursor);
        try {
            if (!subtleCrypto.verify(ALGORITHM, this.opts.signingKey, Buffer.concat([dtBuf, payload]), sig)) {
                throw new Error('Signature did not match');
            }
        }
        catch {
            throw new __1.ApiError('Media token signature is invalid', __1.ErrCode.BadValue);
        }
        const dt = dtBuf.readDoubleBE();
        const endDt = dt === -1 ? undefined : dt;
        // Older tokens (v1) only ever encoded the MXC URI, with no way to tie
        // the media back to the event it was sent from.
        if (version === 1) {
            return {
                mxc: payload.toString(),
                endDt,
            };
        }
        const firstNul = payload.indexOf(0);
        const secondNul = payload.indexOf(0, firstNul + 1);
        const roomId = payload.subarray(0, firstNul).toString() || undefined;
        const eventId = payload.subarray(firstNul + 1, secondNul).toString() || undefined;
        const mxc = payload.subarray(secondNul + 1).toString();
        return {
            mxc,
            endDt,
            roomId,
            eventId,
        };
    }
    /**
     * Generate a public URL for some media.
     * @param mxc The mxc:// URI of the media to be proxied.
     * @param sourceEvent The room and event the media was sent in, if known.
     *                     When provided, the proxy will refuse to serve the
     *                     media once the source event has been redacted.
     */
    async generateMediaUrl(mxc, sourceEvent) {
        const endDt = this.opts.ttl ? Date.now() + this.opts.ttl : undefined;
        // Remove cruft
        const token = await this.getMediaToken({
            endDt,
            mxc: mxc.replace('mxc://', ''),
            roomId: sourceEvent?.roomId,
            eventId: sourceEvent?.eventId,
        });
        const { pathname, origin } = this.opts.publicUrl;
        const slash = pathname.endsWith('/') ? '' : '/';
        const path = new URL(`${pathname}${slash}v1/media/download/${token}`, origin);
        return path;
    }
    async onMediaRequest(req, res) {
        const { mediaToken } = req.params;
        if (typeof mediaToken !== "string") {
            throw new __1.ApiError("Invalid mediaToken supplied", __1.ErrCode.BadValue);
        }
        const metadata = await this.verifyMediaToken(mediaToken);
        if (metadata.endDt && metadata.endDt < Date.now()) {
            throw new __1.ApiError('Access to the media you requested has now expired.', __1.ErrCode.NotFound);
        }
        if (metadata.roomId && metadata.eventId) {
            await this.checkEventNotRedacted(metadata.roomId, metadata.eventId);
        }
        // Cache from this point onwards.
        // Extract the media from the event.
        const mxcMatch = metadata.mxc.match(new RegExp('^([^/]+)/(.+)$'));
        if (!mxcMatch) {
            throw new __1.ApiError('Invalid MXC URI', __1.ErrCode.BadValue);
        }
        const [, serverName, mediaId] = mxcMatch;
        const url = `${this.matrixClient.homeserverUrl}/_matrix/client/v1/media/download/${serverName}/${mediaId}`;
        const get = url.startsWith("https:") ? https_1.get : http_1.get;
        return new Promise((resolve, reject) => {
            get(url, {
                headers: {
                    'Authorization': `Bearer ${this.matrixClient.accessToken}`,
                },
            }, (getRes) => {
                try {
                    const { statusCode } = res;
                    if (getRes.headers['content-disposition']) {
                        res.setHeader('content-disposition', getRes.headers['content-disposition']);
                    }
                    if (getRes.headers['content-type']) {
                        res.setHeader('content-type', getRes.headers['content-type']);
                    }
                    if (getRes.headers['content-length']) {
                        res.setHeader('content-length', getRes.headers['content-length']);
                    }
                    res.status(statusCode);
                    getRes.pipe(res);
                    resolve();
                }
                catch (err) {
                    log.error('Failed to handle authenticated media request:', err);
                    reject(new __1.ApiError('Failed to handle authenticated media request', __1.ErrCode.Unknown));
                }
            });
        });
    }
    /**
     * Ensure that the event the media was sent in has not since been redacted
     * (e.g. because it was found to contain abusive or otherwise unwanted
     * content). Throws an ApiError if the media should no longer be served.
     */
    async checkEventNotRedacted(roomId, eventId) {
        let event;
        try {
            event = await this.matrixClient.getEvent(roomId, eventId);
        }
        catch (ex) {
            log.warn(`Failed to fetch event ${eventId} in ${roomId} while checking for redaction`, ex);
            throw new __1.ApiError('Could not verify that the media is still available', __1.ErrCode.NotFound);
        }
        if (event.unsigned.redacted_because) {
            throw new __1.ApiError('This media is no longer available', __1.ErrCode.NotFound);
        }
    }
    getHealth(req, res) {
        res.send({ ok: true });
    }
    // Needed so that _next can be defined in order to preserve signature.
    onError(err, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _req, res, _next) {
        if (!err) {
            return;
        }
        log.error(err);
        if (res.headersSent) {
            return;
        }
        if ("apply" in err && typeof err.apply === "function") {
            err.apply(res);
        }
        else {
            new __1.ApiError("An internal error occured").apply(res);
        }
    }
}
exports.MediaProxy = MediaProxy;
//# sourceMappingURL=media-proxy.js.map