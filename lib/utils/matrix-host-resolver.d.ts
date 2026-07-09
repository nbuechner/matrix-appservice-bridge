import { URL } from "url";
import { SrvRecord } from "dns";
export declare const MinCacheForMs: number;
export declare const MaxCacheForMs: number;
export declare const DefaultCacheForMs: number;
export interface HostResolveResult {
    host: string;
    hostname: string;
    port: number;
    cacheFor: number;
}
interface DnsInterface {
    resolveSrv(hostname: string): Promise<SrvRecord[]>;
}
/**
 * Class to lookup the hostname, port and host headers of a given Matrix servername
 * according to the
 * [server discovery section of the spec](https://spec.matrix.org/v1.1/server-server-api/#server-discovery).
 */
export declare class MatrixHostResolver {
    private readonly opts;
    private fetch;
    private dns;
    private resultCache;
    constructor(opts?: {
        fetch?: typeof fetch;
        dns?: DnsInterface;
        currentTimeMs?: number;
    });
    get currentTime(): number;
    private static sortSrvRecords;
    private static determineHostType;
    private getWellKnown;
    /**
     * Resolves a Matrix serverName, fetching any delegated information.
     * This request is NOT cached. For general use, please use `resolveMatrixServer`.
     * @param hostname The Matrix `hostname` to resolve. e.g. `matrix.org`
     * @returns An object describing the delegated details for the host.
     */
    resolveMatrixServerName(hostname: string): Promise<HostResolveResult>;
    /**
     * Resolves a Matrix serverName into the baseURL for federated requests, and the
     * `Host` header to use when serving requests.
     *
     * Results are cached by default. Please note that failures are cached, determined by
     * the constant `CacheFailureForMS`.
     * @param hostname The Matrix `hostname` to resolve. e.g. `matrix.org`
     * @param skipCache Should the request be executed regardless of the cached value? Existing cached values will
     *                 be overwritten.
     * @returns The baseurl of the Matrix server (excluding /_matrix/federation suffix), and the hostHeader to be used.
     */
    resolveMatrixServer(hostname: string, skipCache?: boolean): Promise<{
        url: URL;
        hostHeader: string;
    }>;
}
export {};
