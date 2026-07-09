import { webcrypto } from 'node:crypto';
import { Request, Response, default as express } from 'express';
import { MatrixClient } from '@vector-im/matrix-bot-sdk';
interface MediaMetadata {
    endDt?: number;
    mxc: string;
    /**
     * The room the media was sent in, if known. Used to check that the
     * source event has not since been redacted before proxying the media.
     */
    roomId?: string;
    /**
     * The event the media was sent in, if known. Used to check that the
     * source event has not since been redacted before proxying the media.
     */
    eventId?: string;
}
interface Opts {
    publicUrl: URL;
    ttl?: number;
    signingKey: webcrypto.CryptoKey;
}
/**
 * A media proxy class intended for bridges which share media to the
 * public internet.
 */
export declare class MediaProxy {
    private readonly opts;
    private readonly matrixClient;
    private readonly internalRouter;
    /**
     * Only used if start() is called.
     */
    private server?;
    /**
     * Get the express router used for handling calls.
     */
    get router(): express.Router;
    constructor(opts: Opts, matrixClient: MatrixClient);
    start(port: number, hostname?: string, backlog?: number): Promise<void>;
    close(): Promise<void>;
    getMediaToken(metadata: MediaMetadata): Promise<string>;
    verifyMediaToken(token: string): Promise<MediaMetadata>;
    /**
     * Generate a public URL for some media.
     * @param mxc The mxc:// URI of the media to be proxied.
     * @param sourceEvent The room and event the media was sent in, if known.
     *                     When provided, the proxy will refuse to serve the
     *                     media once the source event has been redacted.
     */
    generateMediaUrl(mxc: string, sourceEvent?: {
        roomId: string;
        eventId: string;
    }): Promise<URL>;
    onMediaRequest(req: Request, res: Response): Promise<void>;
    /**
     * Ensure that the event the media was sent in has not since been redacted
     * (e.g. because it was found to contain abusive or otherwise unwanted
     * content). Throws an ApiError if the media should no longer be served.
     */
    private checkEventNotRedacted;
    private getHealth;
    private onError;
}
export {};
