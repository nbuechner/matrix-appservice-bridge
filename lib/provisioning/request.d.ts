import { ThinRequest, Logger } from "..";
import { Request } from "express";
import { ParsedQs } from "qs";
export type Methods = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'checkout' | 'connect' | 'copy' | 'lock' | 'merge' | 'mkactivity' | 'mkcol' | 'move' | 'm-search' | 'notify' | 'propfind' | 'proppatch' | 'purge' | 'report' | 'search' | 'subscribe' | 'trace' | 'unlock' | 'unsubscribe';
export declare class ProvisioningRequest<Params = {
    [key: string]: string;
}, ResBody = any, ReqBody = any, ReqQuery = ParsedQs> implements ThinRequest {
    readonly expressReq: Request<Params, ResBody, ReqBody, ReqQuery>;
    readonly userId: string | null;
    readonly requestSource: "widget" | "provisioner";
    readonly widgetToken?: string | undefined;
    readonly fnName?: string | undefined;
    readonly log: Logger;
    readonly id: string;
    constructor(expressReq: Request<Params, ResBody, ReqBody, ReqQuery>, userId: string | null, requestSource: "widget" | "provisioner", widgetToken?: string | undefined, fnName?: string | undefined);
    getId(): string;
    get body(): ReqBody;
    get params(): Params;
    get query(): ReqQuery;
}
