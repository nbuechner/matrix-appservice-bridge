import { Request as ExRequest, Response as ExResponse, NextFunction } from "express";
import { AppServiceRegistration, AppService } from "matrix-appservice";
import { BridgeContext } from "./components/bridge-context";
import { AppServiceBot } from "./components/app-service-bot";
import { RequestFactory } from "./components/request-factory";
import { Request } from "./components/request";
import { Intent, IntentOpts } from "./components/intent";
import { RoomBridgeStore } from "./components/room-bridge-store";
import { UserBridgeStore } from "./components/user-bridge-store";
import { UserActivityStore } from "./components/user-activity-store";
import { EventBridgeStore } from "./components/event-bridge-store";
import { MatrixUser } from "./models/users/matrix";
import { PrometheusMetrics, BridgeGaugesCounts } from "./components/prometheusmetrics";
import { MembershipCache } from "./components/membership-cache";
import { RoomLinkValidator, RoomLinkValidatorStatus, Rules } from "./components/room-link-validator";
import { RoomUpgradeHandlerOpts } from "./components/room-upgrade-handler";
import { UserActivityTracker } from "./components/user-activity";
import { RemoteUser } from "./models/users/remote";
import { ThirdpartyProtocolResponse, ThirdpartyLocationResponse, ThirdpartyUserResponse } from "./thirdparty";
import { RemoteRoom } from "./models/rooms/remote";
import { Registry } from "prom-client";
import { ClientEncryptionStore } from "./components/encryption";
import { PresenceEvent, ReadReceiptEvent, TypingEvent, WeakEvent } from "./components/event-types";
import { ActivityTracker, ActivityTrackerOpts } from "./components/activity-tracker";
import { EncryptedIntent, EncryptedIntentOpts } from "./components/encrypted-intent";
export declare const BRIDGE_PING_EVENT_TYPE = "org.matrix.bridge.ping";
export declare const BRIDGE_PING_TIMEOUT_MS = 60000;
export interface BridgeController {
    /**
     * The bridge will invoke when an event has been received from the HS.
     */
    onEvent: (request: Request<WeakEvent>, context?: BridgeContext) => void;
    /**
     * The bridge will invoke this when a typing, read reciept or presence event
     * is received from the HS. **This will only work with the `bridgeEncryption`
     * configuration set.**
     */
    onEphemeralEvent?: (request: Request<TypingEvent | ReadReceiptEvent | PresenceEvent>) => void;
    /**
     * The bridge will invoke this function when queried via onUserQuery. If
     * not supplied, no users will be provisioned on user queries. Provisioned users
     * will automatically be stored in the associated `userStore`.
     */
    onUserQuery?: (matrixUser: MatrixUser) => PossiblePromise<{
        name?: string;
        url?: string;
        remote?: RemoteUser;
    } | null | void>;
    /**
     * The bridge will invoke this function when queried via onAliasQuery. If
     * not supplied, no rooms will be provisioned on alias queries. Provisioned rooms
     * will automatically be stored in the associated `roomStore`. */
    onAliasQuery?: (alias: string, aliasLocalpart: string) => PossiblePromise<{
        roomId?: string;
        creationOpts?: Record<string, unknown>;
        remote?: RemoteRoom;
    } | null | void>;
    /**
     * The bridge will invoke this function when a room has been created
     * via onAliasQuery.
     */
    onAliasQueried?: (alias: string, roomId: string) => PossiblePromise<void>;
    /**
     * Invoked when logging. Defaults to a function which logs to the console.
     * */
    onLog?: (text: string, isError: boolean) => void;
    /**
     * If supplied, the bridge will respond to third-party entity lookups using the
     * contained helper functions.
     */
    thirdPartyLookup?: {
        protocols: string[];
        getProtocol?(protocol: string): PossiblePromise<ThirdpartyProtocolResponse>;
        getLocation?(protocol: string, fields: Record<string, string[] | string>): PossiblePromise<ThirdpartyLocationResponse[]>;
        parseLocation?(alias: string): PossiblePromise<ThirdpartyLocationResponse[]>;
        getUser?(protocol: string, fields: Record<string, string[] | string>): PossiblePromise<ThirdpartyUserResponse[]>;
        parseUser?(userid: string): PossiblePromise<ThirdpartyLocationResponse[]>;
    };
    userActivityTracker?: UserActivityTracker;
}
type PossiblePromise<T> = T | Promise<T>;
export interface BridgeOpts {
    /**
     * Application service registration object or path to the registration file.
     */
    registration: AppServiceRegistration | string;
    /**
     * The base HS url
     */
    homeserverUrl: string;
    /**
     * The domain part for user_ids and room aliases e.g. "bar" in "@foo:bar".
     */
    domain: string;
    /**
     * A human readable string that will be used when the bridge signals errors
     * to the client. Will not include in error events if ommited.
     */
    networkName?: string;
    /**
     * The controller logic for the bridge.
     */
    controller: BridgeController;
    /**
     * True to disable enabling of stores.
     * This should be used by bridges that use their own database instances and
     * do not need any of the included store objects. This implies setting
     * disableContext to True. Default: false.
     */
    disableStores?: boolean;
    /**
     * The room store instance to use, or the path to the room .db file to load.
     * A database will be created if this is not specified. If `disableStores` is set,
     * no database will be created or used.
     */
    roomStore?: RoomBridgeStore | string;
    /**
     * The user store instance to use, or the path to the user .db file to load.
     * A database will be created if this is not specified. If `disableStores` is set,
     * no database will be created or used.
     */
    userStore?: UserBridgeStore | string;
    /**
     * The user activity store instance to use, or the path to the user .db file to load.
     * A database will be created if this is not specified. If `disableStores` is set,
     * no database will be created or used.
     */
    userActivityStore?: UserActivityStore | string;
    /**
     * The event store instance to use, or the path to the user .db file to load.
     * A database will NOT be created if this is not specified. If `disableStores` is set,
     * no database will be created or used.
     */
    eventStore?: EventBridgeStore | string;
    /**
     * The membership cache instance
     * to use, which can be manually created by a bridge for greater control over
     * caching. By default a membership cache will be created internally.
     */
    membershipCache?: MembershipCache;
    /**
     * True to stop receiving onEvent callbacks
     * for events which were sent by a bridge user. Default: true.
     */
    suppressEcho?: boolean;
    /**
     * True to enable SUCCESS/FAILED log lines to be sent to onLog. Default: true.
     */
    logRequestOutcome?: boolean;
    /**
     * Escape userIds for non-bot intents with
     * {@link MatrixUser~escapeUserId}
     * Default: true
     */
    escapeUserIds?: boolean;
    /**
     * Options to supply to created Intent instances.
     */
    intentOptions?: {
        /**
         * Options to supply to the bot intent.
         */
        bot?: IntentOpts;
        /**
         * Options to supply to the client intents.
         */
        clients?: IntentOpts;
    };
    /**
     * The factory function used to create intents.
     */
    onIntentCreate?: (userId: string) => Intent;
    /**
     * Options for the `onEvent` queue. When the bridge
     * receives an incoming transaction, it needs to asyncly query the data store for
     * contextual info before calling onEvent. A queue is used to keep the onEvent
     * calls consistent with the arrival order from the incoming transactions.
     */
    queue?: {
        /**
         * The type of queue to use when feeding through to {@link Bridge~onEvent}.
         * - If `none`, events are fed through as soon as contextual info is obtained, which may result
         * in out of order events but stops HOL blocking.
         * - If `single`, onEvent calls will be in order but may be slower due to HOL blocking.
         * - If `per_room`, a queue per room ID is made which reduces the impact of HOL blocking to be scoped to a room.
         *
         * Default: `single`.
         */
        type?: "none" | "single" | "per_room";
        /**
         * `true` to only feed through the next event after the request object in the previous
         * call succeeds or fails. It is **vital** that you consistently resolve/reject the
         * request if this is 'true', else you will not get any further events from this queue.
         * To aid debugging this, consider setting a delayed listener on the request factory.
         *
         * If `false`, the mere invocation of onEvent is enough to trigger the next event in the queue.
         * You probably want to set this to `true` if your {@link Bridge~onEvent} is
         * performing async operations where ordering matters (e.g. messages).
         *
         * Default: false.
         * */
        perRequest?: boolean;
    };
    /**
     * `true` to disable {@link BridgeContext}
     * parameters in {@link Bridge.onEvent}. Disabling the context makes the
     * bridge do fewer database lookups, but prevents there from being a
     * `context` parameter.
     *
     * Default: `false`.
     */
    disableContext?: boolean;
    roomLinkValidation?: {
        rules: Rules;
    };
    roomUpgradeOpts?: RoomUpgradeHandlerOpts;
    bridgeEncryption?: {
        homeserverUrl: string;
        store: ClientEncryptionStore;
    };
    eventValidation?: {
        /**
         * Should we validate that the sender of an edit matches the parent event.
         */
        validateEditSender?: {
            /**
             * If the parent edit event could not be found,
             * should the event be rejected.
             */
            allowEventOnLookupFail: boolean;
        };
    };
    trackUserActivity?: ActivityTrackerOpts;
}
interface VettedBridgeOpts {
    /**
     * Application service registration object or path to the registration file.
     */
    registration: AppServiceRegistration | string;
    /**
     * The base HS url
     */
    homeserverUrl: string;
    /**
     * The domain part for user_ids and room aliases e.g. "bar" in "@foo:bar".
     */
    domain: string;
    /**
     * A human readable string that will be used when the bridge signals errors
     * to the client. Will not include in error events if ommited.
     */
    networkName?: string;
    /**
     * The controller logic for the bridge.
     */
    controller: BridgeController;
    /**
     * True to disable enabling of stores.
     * This should be used by bridges that use their own database instances and
     * do not need any of the included store objects. This implies setting
     * disableContext to True. Default: false.
     */
    disableStores: boolean;
    /**
     * The room store instance to use, or the path to the room .db file to load.
     * A database will be created if this is not specified. If `disableStores` is set,
     * no database will be created or used.
     */
    roomStore: RoomBridgeStore | string;
    /**
     * The user store instance to use, or the path to the user .db file to load.
     * A database will be created if this is not specified. If `disableStores` is set,
     * no database will be created or used.
     */
    userStore: UserBridgeStore | string;
    /**
     * The user activity store instance to use, or the path to the user .db file to load.
     * A database will be created if this is not specified. If `disableStores` is set,
     * no database will be created or used.
     */
    userActivityStore: UserActivityStore | string;
    /**
     * The event store instance to use, or the path to the user .db file to load.
     * A database will NOT be created if this is not specified. If `disableStores` is set,
     * no database will be created or used.
     */
    eventStore?: EventBridgeStore | string;
    /**
     * True to stop receiving onEvent callbacks
     * for events which were sent by a bridge user. Default: true.
     */
    suppressEcho: boolean;
    /**
     * True to enable SUCCESS/FAILED log lines to be sent to onLog. Default: true.
     */
    logRequestOutcome: boolean;
    /**
     * Escape userIds for non-bot intents with
     * {@link MatrixUser~escapeUserId}
     * Default: true
     */
    escapeUserIds?: boolean;
    /**
     * Options to supply to created Intent instances.
     */
    intentOptions: {
        /**
         * Options to supply to the bot intent.
         */
        bot?: IntentOpts;
        /**
         * Options to supply to the client intents.
         */
        clients?: IntentOpts;
    };
    /**
     * The factory function used to create intents. If encryptionOpts is specified, this should create an
     * EncryptedIntent instead.
     */
    onIntentCreate: (userId: string, opts: IntentOpts, encryptionOpts?: EncryptedIntentOpts) => Intent | EncryptedIntent;
    /**
     * Options for the `onEvent` queue. When the bridge
     * receives an incoming transaction, it needs to asyncly query the data store for
     * contextual info before calling onEvent. A queue is used to keep the onEvent
     * calls consistent with the arrival order from the incoming transactions.
     */
    queue: {
        /**
         * The type of queue to use when feeding through to {@link Bridge~onEvent}.
         * - If `none`, events are fed through as soon as contextual info is obtained, which may result
         * in out of order events but stops HOL blocking.
         * - If `single`, onEvent calls will be in order but may be slower due to HOL blocking.
         * - If `per_room`, a queue per room ID is made which reduces the impact of HOL blocking to be scoped to a room.
         *
         * Default: `single`.
         */
        type: "none" | "single" | "per_room";
        /**
         * `true` to only feed through the next event after the request object in the previous
         * call succeeds or fails. It is **vital** that you consistently resolve/reject the
         * request if this is 'true', else you will not get any further events from this queue.
         * To aid debugging this, consider setting a delayed listener on the request factory.
         *
         * If `false`, the mere invocation of onEvent is enough to trigger the next event in the queue.
         * You probably want to set this to `true` if your {@link Bridge~onEvent} is
         * performing async operations where ordering matters (e.g. messages).
         *
         * Default: false.
         * */
        perRequest: boolean;
    };
    /**
     * `true` to disable {@link BridgeContext}
     * parameters in {@link Bridge.onEvent}. Disabling the context makes the
     * bridge do fewer database lookups, but prevents there from being a
     * `context` parameter.
     *
     * Default: `false`.
     */
    disableContext: boolean;
    roomLinkValidation?: {
        rules: Rules;
    };
    roomUpgradeOpts?: RoomUpgradeHandlerOpts;
    bridgeEncryption?: {
        homeserverUrl: string;
        store: ClientEncryptionStore;
    };
    eventValidation?: {
        validateEditSender?: {
            allowEventOnLookupFail: boolean;
        };
    };
    userActivityTracking?: ActivityTrackerOpts;
}
export declare class Bridge {
    private requestFactory;
    private intents;
    private powerlevelMap;
    private membershipCache;
    private queue;
    private intentBackingStore;
    private prevRequestPromise;
    private readonly onLog;
    private intentLastAccessedTimeout;
    private botIntent?;
    private appServiceBot?;
    private metrics?;
    private roomLinkValidator?;
    private roomUpgradeHandler?;
    private roomStore?;
    private userStore?;
    private userActivityStore?;
    private eventStore?;
    private registration?;
    private appservice?;
    private botSdkAS?;
    private eeEventBroker?;
    private selfPingDeferred?;
    readonly opts: VettedBridgeOpts;
    private internalActivityTracker?;
    get activityTracker(): ActivityTracker | undefined;
    get appService(): AppService;
    get botUserId(): string;
    /**
     * @param opts Options to pass to the bridge
     * @param opts.roomUpgradeOpts Options to supply to
     * the room upgrade handler. If not defined then upgrades are NOT handled by the bridge.
     */
    constructor(opts: BridgeOpts);
    /**
     * Load the user and room databases. Access them via getUserStore() and getRoomStore().
     */
    loadDatabases(): Promise<void>;
    /**
     * Load registration, databases and initialise bridge components.
     *
     * **This must be called before `listen()`**
     */
    initialise(): Promise<void>;
    /**
     * Setup a HTTP listener to handle appservice traffic.
     * ** This must be called after .initialise() **
     * @param port The port to listen on.
     * @param appServiceInstance The AppService instance to attach to.
     * If not provided, one will be created.
     * @param hostname Optional hostname to bind to.
     */
    listen(port: number, hostname?: string, backlog?: number, appServiceInstance?: AppService): Promise<void>;
    /**
     * Run the bridge (start listening). This calls `initialise()` and `listen()`.
     * @param port The port to listen on.
     * @param appServiceInstance The AppService instance to attach to.
     * If not provided, one will be created.
     * @param hostname Optional hostname to bind to.
     * @return A promise resolving when the bridge is ready.
     */
    run(port: number, appServiceInstance?: AppService, hostname?: string, backlog?: number): Promise<void>;
    private setupIntentCulling;
    private customiseAppserviceThirdPartyLookup;
    /**
     * Install a custom handler for an incoming HTTP API request. This allows
     * callers to add extra functionality, implement new APIs, etc...
     * @param opts Named options
     * @param opts.authenticate Should the token be automatically checked. Defaults to true.
     * @param opts.handler Function to handle requests
     * @param opts.method The HTTP method name.
     * @param opts.path Path to the endpoint.
     * to this endpoint.
     */
    addAppServicePath(opts: {
        method: "GET" | "PUT" | "POST" | "DELETE";
        path: string;
        authenticate?: boolean;
        handler: (req: ExRequest, respose: ExResponse, next: NextFunction) => void;
    }): void;
    /**
     * Retrieve the connected room store instance, if one was configured.
     */
    getRoomStore(): RoomBridgeStore | undefined;
    /**
     * Retrieve the connected user store instance, if one was configured.
     */
    getUserStore(): UserBridgeStore | undefined;
    /**
     * Retrieve the connected user activity store instance.
     */
    getUserActivityStore(): UserActivityStore | undefined;
    /**
     * Retrieve the connected event store instance, if one was configured.
     */
    getEventStore(): EventBridgeStore | undefined;
    /**
     * Retrieve the request factory used to create incoming requests.
     */
    getRequestFactory(): RequestFactory;
    /**
     * Get the AS bot instance.
     */
    getBot(): AppServiceBot;
    /**
     * Determines whether a room should be provisoned based on
     * user provided rules and the room state. Will default to true
     * if no rules have been provided.
     * @param roomId The room to check.
     * @param cache Should the validator check its cache.
     * @returns resolves if can and rejects if it cannot.
     *          A status code is returned on both.
     */
    canProvisionRoom(roomId: string, cache?: boolean): Promise<RoomLinkValidatorStatus>;
    getRoomLinkValidator(): RoomLinkValidator | undefined;
    /**
     * Retrieve an Intent instance for the specified user ID. If no ID is given, an
     * instance for the bot itself is returned.
     * @param userId Optional. The user ID to get an Intent for.
     * @param request Optional. The request instance to tie the MatrixClient
     * instance to. Useful for logging contextual request IDs.
     * @return The intent instance
     */
    getIntent(userId?: string, request?: Request<unknown>): Intent | EncryptedIntent;
    /**
     * Retrieve an Intent instance for the specified user ID localpart. This <i>must
     * be the complete user localpart</i>.
     * @param localpart The user ID localpart to get an Intent for.
     * @param request Optional. The request instance to tie the MatrixClient
     * instance to. Useful for logging contextual request IDs.
     * @return The intent instance
     */
    getIntentFromLocalpart(localpart: string, request?: Request<unknown>): Intent;
    /**
     * Provision a user on the homeserver.
     * @param matrixUser The virtual user to be provisioned.
     * @param provisionedUser Provisioning information.
     * @return Resolved when provisioned.
     */
    provisionUser(matrixUser: MatrixUser, provisionedUser?: {
        name?: string;
        url?: string;
        remote?: RemoteUser;
    }): Promise<void>;
    private onUserQuery;
    private onAliasQuery;
    private onEphemeralEvent;
    /**
     * Find a member for a given room. This method will fetch the joined members
     * from the homeserver if the cache doesn't have it stored.
     * @param preferBot Should we prefer the bot user over a ghost user
     * @returns The userID of the member.
     */
    getAnyASMemberInRoom(roomId: string, preferBot?: boolean): Promise<string | null>;
    private validateEditEvent;
    private onEvent;
    /**
     * Restricts the promise according to the bridges `perRequest` setting.
     *
     * `perRequest` enabled:
     *     Returns a promise similar to `promise`, with the addition of it only
     *     resolving after `request`.
     * `perRequest` disabled:
     *     Returns the promise unchanged.
     */
    private limited;
    private onConsume;
    private getBridgeContext;
    private handleEventError;
    /**
     * Returns a regex matching all users of the bridge.
     * @return Super regex composed of all user regexes.
     */
    private getUserRegex;
    private updateIntents;
    private setPowerLevelEntry;
    private getPowerLevelEntry;
    /**
     * Returns a PrometheusMetrics instance stored on the bridge, creating it first
     * if required. The instance will be registered with the HTTP server so it can
     * serve the "/metrics" page in the usual way.
     * The instance will automatically register the Matrix SDK metrics by calling
     * {PrometheusMetrics~registerMatrixSdkMetrics}.
     *
     * Ensure that `PackageInfo.getBridgeVersion` is returns the correct version before calling this,
     * as changes to the bridge version after metric instantiation will not be detected.
     *
     * @param {boolean} registerEndpoint Register the /metrics endpoint on the appservice HTTP server. Defaults to true.
     *                                   Note: `listen()` must have been called if this is true or this will throw.
     * @param {Registry?} registry Optionally provide an alternative registry for metrics.
     */
    getPrometheusMetrics(registerEndpoint?: boolean, registry?: Registry): PrometheusMetrics;
    /**
     * A convenient shortcut to calling registerBridgeGauges() on the
     * PrometheusMetrics instance directly. This version will supply the value of
     * the matrixGhosts field if the counter function did not return it, for
     * convenience.
     * @param {PrometheusMetrics~BridgeGaugesCallback} counterFunc A function that
     * when invoked returns the current counts of various items in the bridge.
     *
     * @example
     * bridge.registerBridgeGauges(() => {
     *     return {
     *         matrixRoomConfigs: Object.keys(this.matrixRooms).length,
     *         remoteRoomConfigs: Object.keys(this.remoteRooms).length,
     *
     *         remoteGhosts: Object.keys(this.remoteGhosts).length,
     *
     *         ...
     *     }
     * })
     */
    registerBridgeGauges(counterFunc: () => Promise<BridgeGaugesCounts> | BridgeGaugesCounts): void;
    /**
     * Check a express Request to see if it's correctly
     * authenticated (includes the hsToken). The query parameter `access_token`
     * and the `Authorization` header are checked.
     * @returns {Boolean} True if authenticated, False if not.
     */
    requestCheckToken(req: ExRequest): boolean;
    /**
     * Close the appservice HTTP listener, and clear all timeouts.
     * @returns Resolves when the appservice HTTP listener has stopped
     */
    close(): Promise<void>;
    checkHomeserverSupport(): Promise<void>;
    /**
     * Check the homeserver -> appservice connection by
     * sending a ping event.
     * @param roomId The room to use as a ping check.
     * @param timeoutMs How long to wait for the ping attempt. Defaults to 60s.
     * @throws This will throw if another ping attempt is made, or if the request times out.
     * @returns The delay in milliseconds
     */
    pingAppserviceRoute(roomId: string, timeoutMs?: number): Promise<number>;
    updateRoomLinkValidatorRules(rules: Rules): void;
    private onIntentCreate;
    private onEphemeralActivity;
}
export {};
