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
exports.Bridge = exports.BRIDGE_PING_TIMEOUT_MS = exports.BRIDGE_PING_EVENT_TYPE = void 0;
const fs_1 = require("fs");
const util = __importStar(require("util"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const matrix_appservice_1 = require("matrix-appservice");
const bridge_context_1 = require("./components/bridge-context");
const app_service_bot_1 = require("./components/app-service-bot");
const request_factory_1 = require("./components/request-factory");
const intent_1 = require("./components/intent");
const room_bridge_store_1 = require("./components/room-bridge-store");
const user_bridge_store_1 = require("./components/user-bridge-store");
const user_activity_store_1 = require("./components/user-activity-store");
const event_bridge_store_1 = require("./components/event-bridge-store");
const matrix_1 = require("./models/users/matrix");
const matrix_2 = require("./models/rooms/matrix");
const prometheusmetrics_1 = require("./components/prometheusmetrics");
const membership_cache_1 = require("./components/membership-cache");
const room_link_validator_1 = require("./components/room-link-validator");
const room_upgrade_handler_1 = require("./components/room-upgrade-handler");
const event_queue_1 = require("./components/event-queue");
const _1 = require(".");
const promiseutil_1 = require("./utils/promiseutil");
const errors_1 = require("./errors");
var BridgeInternalError = errors_1.unstable.BridgeInternalError;
var wrapError = errors_1.unstable.wrapError;
var EventNotHandledError = errors_1.unstable.EventNotHandledError;
const encryption_1 = require("./components/encryption");
const BotSDK = __importStar(require("@vector-im/matrix-bot-sdk"));
const activity_tracker_1 = require("./components/activity-tracker");
const encrypted_intent_1 = require("./components/encrypted-intent");
const log = new _1.Logger("bridge");
// The frequency at which we will check the list of accumulated Intent objects.
const INTENT_CULL_CHECK_PERIOD_MS = 1000 * 60; // once per minute
// How long a given Intent object can hang around unused for.
const INTENT_CULL_EVICT_AFTER_MS = 1000 * 60 * 15; // 15 minutes
exports.BRIDGE_PING_EVENT_TYPE = "org.matrix.bridge.ping";
exports.BRIDGE_PING_TIMEOUT_MS = 60000;
// How old can a receipt be before we treat it as stale.
const RECEIPT_CUTOFF_TIME_MS = 60000;
class Bridge {
    requestFactory;
    intents; // user_id + request_id => Intent
    powerlevelMap; // room_id => powerlevels
    membershipCache;
    queue;
    intentBackingStore;
    prevRequestPromise;
    onLog;
    intentLastAccessedTimeout = null;
    botIntent;
    appServiceBot;
    metrics;
    roomLinkValidator;
    roomUpgradeHandler;
    roomStore;
    userStore;
    userActivityStore;
    eventStore;
    registration;
    appservice;
    botSdkAS;
    eeEventBroker;
    selfPingDeferred;
    opts;
    internalActivityTracker;
    get activityTracker() {
        return this.internalActivityTracker;
    }
    get appService() {
        if (!this.appservice) {
            throw Error('appservice not defined yet');
        }
        return this.appservice;
    }
    get botUserId() {
        if (!this.registration) {
            throw Error('Registration not defined yet');
        }
        return `@${this.registration.getSenderLocalpart()}:${this.opts.domain}`;
    }
    /**
     * @param opts Options to pass to the bridge
     * @param opts.roomUpgradeOpts Options to supply to
     * the room upgrade handler. If not defined then upgrades are NOT handled by the bridge.
     */
    constructor(opts) {
        if (typeof opts !== "object") {
            throw new Error("opts must be supplied.");
        }
        const required = [
            "homeserverUrl", "registration", "domain", "controller"
        ];
        const missingKeys = required.filter(k => !Object.keys(opts).includes(k));
        if (missingKeys.length) {
            throw new Error(`Missing '${missingKeys.join("', '")}' in opts.`);
        }
        if (typeof opts.controller.onEvent !== "function") {
            throw new Error("controller.onEvent is a required function");
        }
        this.opts = {
            ...opts,
            disableContext: opts.disableStores ? true : (opts.disableContext ?? false),
            disableStores: opts.disableStores ?? false,
            userStore: opts.userStore || "user-store.db",
            userActivityStore: opts.userActivityStore || "user-activity-store.db",
            roomStore: opts.roomStore || "room-store.db",
            intentOptions: opts.intentOptions || {},
            onIntentCreate: opts.onIntentCreate ?? this.onIntentCreate.bind(this),
            queue: {
                type: opts.queue?.type || "single",
                perRequest: opts.queue?.perRequest ?? false,
            },
            logRequestOutcome: opts.logRequestOutcome ?? true,
            suppressEcho: opts.suppressEcho ?? true,
            eventValidation: opts.hasOwnProperty("eventValidation") ? opts.eventValidation : {
                validateEditSender: {
                    allowEventOnLookupFail: false
                }
            }
        };
        this.queue = event_queue_1.EventQueue.create(this.opts.queue, this.onConsume.bind(this));
        // Default: logger -> log to console
        this.onLog = opts.controller.onLog || function (text, isError) {
            if (isError) {
                log.error(text);
                return;
            }
            log.info(text);
        };
        // we'll init these at runtime
        this.requestFactory = new request_factory_1.RequestFactory();
        this.intents = new Map();
        this.powerlevelMap = new Map();
        this.membershipCache = opts.membershipCache || new membership_cache_1.MembershipCache();
        this.intentBackingStore = {
            setMembership: this.membershipCache.setMemberEntry.bind(this.membershipCache),
            setPowerLevelContent: this.setPowerLevelEntry.bind(this),
            getMembership: this.membershipCache.getMemberEntry.bind(this.membershipCache),
            getMemberProfile: this.membershipCache.getMemberProfile.bind(this.membershipCache),
            getPowerLevelContent: this.getPowerLevelEntry.bind(this)
        };
        this.prevRequestPromise = Promise.resolve();
        if (this.opts.roomUpgradeOpts) {
            this.opts.roomUpgradeOpts.consumeEvent = this.opts.roomUpgradeOpts.consumeEvent !== false;
            if (this.opts.disableStores) {
                this.opts.roomUpgradeOpts.migrateStoreEntries = false;
            }
            this.roomUpgradeHandler = new room_upgrade_handler_1.RoomUpgradeHandler(this.opts.roomUpgradeOpts, this);
        }
    }
    /**
     * Load the user and room databases. Access them via getUserStore() and getRoomStore().
     */
    async loadDatabases() {
        if (this.opts.disableStores) {
            return;
        }
        const storePromises = [];
        // Load up the databases if they provided file paths to them (or defaults)
        if (typeof this.opts.userStore === "string") {
            storePromises.push(loadDatabase(this.opts.userStore, user_bridge_store_1.UserBridgeStore));
        }
        else {
            storePromises.push(Promise.resolve(this.opts.userStore));
        }
        if (typeof this.opts.userActivityStore === "string") {
            storePromises.push(loadDatabase(this.opts.userActivityStore, user_activity_store_1.UserActivityStore));
        }
        else {
            storePromises.push(Promise.resolve(this.opts.userActivityStore));
        }
        if (typeof this.opts.roomStore === "string") {
            storePromises.push(loadDatabase(this.opts.roomStore, room_bridge_store_1.RoomBridgeStore));
        }
        else {
            storePromises.push(Promise.resolve(this.opts.roomStore));
        }
        if (typeof this.opts.eventStore === "string") {
            storePromises.push(loadDatabase(this.opts.eventStore, event_bridge_store_1.EventBridgeStore));
        }
        else if (this.opts.eventStore) {
            storePromises.push(Promise.resolve(this.opts.eventStore));
        }
        // This works because if they provided a string we converted it to a Promise
        // which will be resolved when we have the db instance. If they provided a
        // db instance then this will resolve immediately.
        const [userStore, userActivityStore, roomStore, eventStore] = await Promise.all(storePromises);
        this.userStore = userStore;
        this.userActivityStore = userActivityStore;
        this.roomStore = roomStore;
        this.eventStore = eventStore;
    }
    /**
     * Load registration, databases and initialise bridge components.
     *
     * **This must be called before `listen()`**
     */
    async initialise() {
        if (typeof this.opts.registration === "string") {
            const regObj = js_yaml_1.default.load(await fs_1.promises.readFile(this.opts.registration, 'utf8'));
            if (typeof regObj !== "object") {
                throw Error("Failed to parse registration file: yaml file did not parse to object");
            }
            const registration = matrix_appservice_1.AppServiceRegistration.fromObject(regObj);
            if (registration === null) {
                throw Error("Failed to parse registration file");
            }
            this.registration = registration;
        }
        else {
            this.registration = this.opts.registration;
        }
        const asToken = this.registration.getAppServiceToken();
        if (!asToken) {
            throw Error('No AS token provided in registration config!');
        }
        const rawReg = this.registration.getOutput();
        this.botSdkAS = new BotSDK.Appservice({
            registration: {
                ...rawReg,
                url: rawReg.url,
                protocols: rawReg.protocols || undefined,
                namespaces: {
                    users: [{
                            // Deliberately greedy regex to fix https://github.com/turt2live/matrix-bot-sdk/issues/159
                            // Note: We don't use the localpart generating functionality of the bot-sdk,
                            // so this is okay to do.
                            regex: "@.+_.+:.*",
                            exclusive: true,
                        }],
                    rooms: rawReg.namespaces?.rooms || [],
                    aliases: rawReg.namespaces?.aliases || [],
                }
            },
            // If using encryption, we want to go via pantalaimon.
            homeserverUrl: this.opts.bridgeEncryption?.homeserverUrl || this.opts.homeserverUrl,
            homeserverName: this.opts.domain,
            // Unused atm.
            port: 0,
            bindAddress: "127.0.0.1",
        });
        if (this.metrics) {
            this.metrics.registerMatrixSdkMetrics(this.botSdkAS);
        }
        await this.checkHomeserverSupport();
        this.appServiceBot = new app_service_bot_1.AppServiceBot(this.botSdkAS.botClient, this.botUserId, this.registration, this.membershipCache);
        if (this.opts.bridgeEncryption) {
            this.eeEventBroker = new encryption_1.EncryptedEventBroker(this.membershipCache, this.appServiceBot, this.onEvent.bind(this), this.getIntent.bind(this), this.opts.bridgeEncryption.store);
        }
        if (this.opts.roomLinkValidation !== undefined) {
            this.roomLinkValidator = new room_link_validator_1.RoomLinkValidator(this.opts.roomLinkValidation, this.appServiceBot);
        }
        this.requestFactory = new request_factory_1.RequestFactory();
        if (this.opts.logRequestOutcome) {
            this.requestFactory.addDefaultResolveCallback((req) => this.onLog("[" + req.getId() + "] SUCCESS (" + req.getDuration() + "ms)", false));
            this.requestFactory.addDefaultRejectCallback((req, err) => this.onLog("[" + req.getId() + "] FAILED (" + req.getDuration() + "ms) " +
                (err ? util.inspect(err) : ""), false));
        }
        const botIntentOpts = {
            registered: true,
            backingStore: this.intentBackingStore,
            ...this.opts.intentOptions?.bot, // copy across opts, if defined
        };
        this.botIntent = this.opts.onIntentCreate(this.botUserId, botIntentOpts);
        this.setupIntentCulling();
        if (this.opts.userActivityTracking) {
            if (!this.registration.pushEphemeral) {
                log.info("Sending ephemeral events to the bridge is currently disabled in the registration file," +
                    " so user activity will not be captured");
            }
            this.internalActivityTracker = new activity_tracker_1.ActivityTracker(this.botIntent.matrixClient, this.opts.userActivityTracking);
        }
        await this.loadDatabases();
    }
    /**
     * Setup a HTTP listener to handle appservice traffic.
     * ** This must be called after .initialise() **
     * @param port The port to listen on.
     * @param appServiceInstance The AppService instance to attach to.
     * If not provided, one will be created.
     * @param hostname Optional hostname to bind to.
     */
    async listen(port, hostname = "0.0.0.0", backlog = 10, appServiceInstance) {
        if (!this.registration) {
            throw Error('initialise() not called, cannot listen');
        }
        const homeserverToken = this.registration.getHomeserverToken();
        if (!homeserverToken) {
            throw Error('No HS token provided, cannot create AppService');
        }
        this.appservice = appServiceInstance || new matrix_appservice_1.AppService({
            homeserverToken,
        });
        this.appservice.onUserQuery = (userId) => this.onUserQuery(userId);
        this.appservice.onAliasQuery = this.onAliasQuery.bind(this);
        this.appservice.on("event", async (event) => {
            let passthrough = true;
            const weakEvent = event;
            if (this.eeEventBroker) {
                passthrough = await this.eeEventBroker.onASEvent(weakEvent);
            }
            if (passthrough) {
                return this.onEvent(weakEvent);
            }
            return undefined;
        });
        this.appservice.on("ephemeral", async (event) => this.onEphemeralEvent(event));
        this.appservice.on("http-log", (line) => {
            this.onLog(line, false);
        });
        this.customiseAppserviceThirdPartyLookup();
        if (this.metrics) {
            this.metrics.addAppServicePath(this);
        }
        await this.appservice.listen(port, hostname, backlog);
    }
    /**
     * Run the bridge (start listening). This calls `initialise()` and `listen()`.
     * @param port The port to listen on.
     * @param appServiceInstance The AppService instance to attach to.
     * If not provided, one will be created.
     * @param hostname Optional hostname to bind to.
     * @return A promise resolving when the bridge is ready.
     */
    async run(port, appServiceInstance, hostname = "0.0.0.0", backlog = 10) {
        await this.initialise();
        await this.listen(port, hostname, backlog, appServiceInstance);
    }
    // Set a timer going which will periodically remove Intent objects to prevent
    // them from accumulating too much. Removal is based on access time (calls to
    // getIntent). Intents expire after `INTENT_CULL_EVICT_AFTER_MS` of not being called.
    setupIntentCulling() {
        if (this.intentLastAccessedTimeout) {
            clearTimeout(this.intentLastAccessedTimeout);
        }
        this.intentLastAccessedTimeout = setTimeout(() => {
            const now = Date.now();
            for (const [key, entry] of this.intents.entries()) {
                // Do not delete intents that sync.
                const lastAccess = now - entry.lastAccessed;
                if (lastAccess < INTENT_CULL_EVICT_AFTER_MS) {
                    // Intent is still in use.
                    continue;
                }
                if (this.eeEventBroker?.shouldAvoidCull(entry.intent)) {
                    // Intent is syncing events for encrypted rooms
                    continue;
                }
                this.intents.delete(key);
            }
            this.intentLastAccessedTimeout = null;
            // repeat forever. We have no cancellation mechanism but we don't expect
            // Bridge objects to be continually recycled so this is fine.
            this.setupIntentCulling();
        }, INTENT_CULL_CHECK_PERIOD_MS);
    }
    customiseAppserviceThirdPartyLookup() {
        const lookupController = this.opts.controller.thirdPartyLookup;
        if (!lookupController) {
            // Nothing to do.
            return;
        }
        const protocols = lookupController.protocols || [];
        const respondErr = function (e, res) {
            if (e instanceof Object) {
                const r = e;
                if (r.code && r.err) {
                    res.status(r.code).json({ error: r.err });
                    return;
                }
            }
            res.status(500).send(`Failed: ${e}`);
        };
        if (lookupController.getProtocol) {
            const getProtocolFunc = lookupController.getProtocol;
            this.addAppServicePath({
                method: "GET",
                path: "/_matrix/app/:version(v1|unstable)/thirdparty/protocol/:protocol",
                handler: async (req, res) => {
                    const protocol = req.params.protocol;
                    if (protocols.length && protocols.indexOf(protocol) === -1) {
                        res.status(404).json({ err: "Unknown 3PN protocol " + protocol });
                        return;
                    }
                    try {
                        const result = await getProtocolFunc(protocol);
                        res.status(200).json(result);
                    }
                    catch (ex) {
                        respondErr(ex, res);
                    }
                },
            });
        }
        if (lookupController.getLocation) {
            const getLocationFunc = lookupController.getLocation;
            this.addAppServicePath({
                method: "GET",
                path: "/_matrix/app/:version(v1|unstable)/thirdparty/location/:protocol",
                handler: async (req, res) => {
                    const protocol = req.params.protocol;
                    if (protocols.length && protocols.indexOf(protocol) === -1) {
                        res.status(404).json({ err: "Unknown 3PN protocol " + protocol });
                        return;
                    }
                    // Do not leak access token to function
                    delete req.query.access_token;
                    try {
                        const result = await getLocationFunc(protocol, req.query);
                        res.status(200).json(result);
                    }
                    catch (ex) {
                        respondErr(ex, res);
                    }
                },
            });
        }
        if (lookupController.parseLocation) {
            const parseLocationFunc = lookupController.parseLocation;
            this.addAppServicePath({
                method: "GET",
                path: "/_matrix/app/:version(v1|unstable)/thirdparty/location",
                handler: async (req, res) => {
                    const alias = req.query.alias;
                    if (!alias) {
                        res.status(400).send({ err: "Missing 'alias' parameter" });
                        return;
                    }
                    if (typeof alias !== "string") {
                        res.status(400).send({ err: "'alias' must be a string" });
                        return;
                    }
                    try {
                        const result = await parseLocationFunc(alias);
                        res.status(200).json(result);
                    }
                    catch (ex) {
                        respondErr(ex, res);
                    }
                },
            });
        }
        if (lookupController.getUser) {
            const getUserFunc = lookupController.getUser;
            this.addAppServicePath({
                method: "GET",
                path: "/_matrix/app/:version(v1|unstable)/thirdparty/user/:protocol",
                handler: async (req, res) => {
                    const protocol = req.params.protocol;
                    if (protocols.length && protocols.indexOf(protocol) === -1) {
                        res.status(404).json({ err: "Unknown 3PN protocol " + protocol });
                        return;
                    }
                    try {
                        const result = await getUserFunc(protocol, req.query);
                        res.status(200).json(result);
                    }
                    catch (ex) {
                        respondErr(ex, res);
                    }
                }
            });
        }
        if (lookupController.parseUser) {
            const parseUserFunc = lookupController.parseUser;
            this.addAppServicePath({
                method: "GET",
                path: "/_matrix/app/:version(v1|unstable)/thirdparty/user",
                handler: async (req, res) => {
                    const userid = req.query.userid;
                    if (!userid) {
                        res.status(400).send({ err: "Missing 'userid' parameter" });
                        return;
                    }
                    if (typeof userid !== "string") {
                        res.status(400).send({ err: "'userid' must be a string" });
                        return;
                    }
                    try {
                        const result = await parseUserFunc(userid);
                        res.status(200).json(result);
                    }
                    catch (ex) {
                        respondErr(ex, res);
                    }
                },
            });
        }
    }
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
    addAppServicePath(opts) {
        if (!this.appservice) {
            throw Error('Cannot call addAppServicePath before calling .run()');
        }
        const app = this.appservice.expressApp;
        const authenticate = opts.authenticate ?? true;
        app[opts.method.toLowerCase()](opts.path, (req, res, ...args) => {
            if (authenticate && !this.requestCheckToken(req)) {
                return res.status(403).send({
                    errcode: "M_FORBIDDEN",
                    error: "Bad token supplied,"
                });
            }
            // Do not leak access token to function
            delete req.query.access_token;
            return opts.handler(req, res, ...args);
        });
    }
    /**
     * Retrieve the connected room store instance, if one was configured.
     */
    getRoomStore() {
        return this.roomStore;
    }
    /**
     * Retrieve the connected user store instance, if one was configured.
     */
    getUserStore() {
        return this.userStore;
    }
    /**
     * Retrieve the connected user activity store instance.
     */
    getUserActivityStore() {
        return this.userActivityStore;
    }
    /**
     * Retrieve the connected event store instance, if one was configured.
     */
    getEventStore() {
        return this.eventStore;
    }
    /**
     * Retrieve the request factory used to create incoming requests.
     */
    getRequestFactory() {
        return this.requestFactory;
    }
    /**
     * Get the AS bot instance.
     */
    getBot() {
        if (!this.appServiceBot) {
            throw Error('Bridge is not ready');
        }
        return this.appServiceBot;
    }
    /**
     * Determines whether a room should be provisoned based on
     * user provided rules and the room state. Will default to true
     * if no rules have been provided.
     * @param roomId The room to check.
     * @param cache Should the validator check its cache.
     * @returns resolves if can and rejects if it cannot.
     *          A status code is returned on both.
     */
    async canProvisionRoom(roomId, cache = true) {
        if (!this.roomLinkValidator) {
            return room_link_validator_1.RoomLinkValidatorStatus.PASSED;
        }
        return this.roomLinkValidator.validateRoom(roomId, cache);
    }
    getRoomLinkValidator() {
        return this.roomLinkValidator;
    }
    /**
     * Retrieve an Intent instance for the specified user ID. If no ID is given, an
     * instance for the bot itself is returned.
     * @param userId Optional. The user ID to get an Intent for.
     * @param request Optional. The request instance to tie the MatrixClient
     * instance to. Useful for logging contextual request IDs.
     * @return The intent instance
     */
    getIntent(userId, request) {
        if (!this.appServiceBot || !this.botSdkAS) {
            throw Error('Cannot call getIntent before calling .initialise()');
        }
        if (!userId) {
            if (!this.botIntent) {
                // This will be defined when .run is called.
                throw Error('Cannot call getIntent before calling .initialise()');
            }
            return this.botIntent;
        }
        else if (userId === this.botUserId) {
            if (!this.botIntent) {
                // This will be defined when .run is called.
                throw Error('Cannot call getIntent before calling .initialise()');
            }
            return this.botIntent;
        }
        if (this.opts.escapeUserIds === undefined || this.opts.escapeUserIds) {
            userId = new matrix_1.MatrixUser(userId).getId(); // Escape the ID
        }
        const key = userId + (request ? request.getId() : "");
        const existingIntent = this.intents.get(key);
        if (existingIntent) {
            existingIntent.lastAccessed = Date.now();
            return existingIntent.intent;
        }
        const clientIntentOpts = {
            backingStore: this.intentBackingStore,
            ...this.opts.intentOptions?.clients,
            onEventSent: () => userId && this.opts.controller.userActivityTracker?.updateUserActivity(userId),
        };
        clientIntentOpts.registered = this.membershipCache.isUserRegistered(userId);
        let encryptionIntentOpts;
        const encryptionOpts = this.opts.bridgeEncryption;
        if (encryptionOpts) {
            encryptionIntentOpts = {
                sessionPromise: encryptionOpts.store.getStoredSession(userId),
                originalHomeserverUrl: this.opts.homeserverUrl,
                sessionCreatedCallback: encryptionOpts.store.setStoredSession.bind(encryptionOpts.store),
                ensureClientSyncingCallback: async () => {
                    return this.eeEventBroker?.startSyncingUser(userId || this.botUserId);
                },
            };
        }
        const intent = this.opts.onIntentCreate(userId, clientIntentOpts, encryptionIntentOpts);
        this.intents.set(key, { intent, lastAccessed: Date.now() });
        return intent;
    }
    /**
     * Retrieve an Intent instance for the specified user ID localpart. This <i>must
     * be the complete user localpart</i>.
     * @param localpart The user ID localpart to get an Intent for.
     * @param request Optional. The request instance to tie the MatrixClient
     * instance to. Useful for logging contextual request IDs.
     * @return The intent instance
     */
    getIntentFromLocalpart(localpart, request) {
        return this.getIntent("@" + localpart + ":" + this.opts.domain, request);
    }
    /**
     * Provision a user on the homeserver.
     * @param matrixUser The virtual user to be provisioned.
     * @param provisionedUser Provisioning information.
     * @return Resolved when provisioned.
     */
    async provisionUser(matrixUser, provisionedUser) {
        if (!this.botSdkAS) {
            throw Error('Cannot call getIntent before calling .run()');
        }
        const intent = this.getIntentFromLocalpart(matrixUser.localpart);
        await intent.ensureRegistered();
        if (!this.opts.disableStores) {
            if (!this.userStore) {
                throw Error('Tried to call provisionUser before databases were loaded');
            }
            await this.userStore.setMatrixUser(matrixUser);
            if (provisionedUser?.remote) {
                await this.userStore.linkUsers(matrixUser, provisionedUser.remote);
            }
        }
        if (provisionedUser?.name) {
            await intent.setDisplayName(provisionedUser.name);
        }
        if (provisionedUser?.url) {
            await intent.setAvatarUrl(provisionedUser.url);
        }
    }
    async onUserQuery(userId) {
        if (!this.opts.controller.onUserQuery) {
            return;
        }
        const matrixUser = new matrix_1.MatrixUser(userId);
        try {
            const provisionedUser = await this.opts.controller.onUserQuery(matrixUser);
            if (!provisionedUser) {
                log.warn(`Not provisioning user for ${userId}`);
                return;
            }
            await this.provisionUser(matrixUser, provisionedUser);
        }
        catch (ex) {
            log.error(`Failed onUserQuery for ${userId}`, ex);
            throw ex;
        }
    }
    async onAliasQuery(alias) {
        if (!this.opts.controller.onAliasQuery) {
            return;
        }
        if (!this.botIntent) {
            throw Error('botIntent is not ready yet');
        }
        const aliasLocalpart = alias.split(":")[0].substring(1);
        const provisionedRoom = await this.opts.controller.onAliasQuery(alias, aliasLocalpart);
        if (!provisionedRoom) {
            // Not provisioning room.
            throw Error("Not provisioning room for this alias");
        }
        let roomId = provisionedRoom.roomId;
        // If they didn't pass an existing `roomId` back,
        // we expect some `creationOpts` to create a new room
        if (roomId === undefined) {
            roomId = await this.botIntent.botSdkIntent.underlyingClient.createRoom(provisionedRoom.creationOpts);
        }
        if (!roomId) {
            // In theory this should never be called, but typescript isn't happy.
            throw Error('Expected roomId to be truthy');
        }
        if (!this.opts.disableStores) {
            if (!this.roomStore) {
                throw Error("roomStore is not ready yet");
            }
            const matrixRoom = new matrix_2.MatrixRoom(roomId);
            const remoteRoom = provisionedRoom.remote;
            if (remoteRoom) {
                await this.roomStore.linkRooms(matrixRoom, remoteRoom, {});
            }
            else {
                // store the matrix room only
                await this.roomStore.setMatrixRoom(matrixRoom);
            }
        }
        if (this.opts.controller.onAliasQueried) {
            await this.opts.controller.onAliasQueried(alias, roomId);
        }
    }
    async onEphemeralEvent(event) {
        try {
            await this.onEphemeralActivity(event);
        }
        catch (ex) {
            log.error(`Failed to handle ephemeral activity`, ex);
        }
        if (this.opts.controller.onEphemeralEvent) {
            const request = this.requestFactory.newRequest({ data: event });
            await this.opts.controller.onEphemeralEvent(request);
        }
    }
    /**
     * Find a member for a given room. This method will fetch the joined members
     * from the homeserver if the cache doesn't have it stored.
     * @param preferBot Should we prefer the bot user over a ghost user
     * @returns The userID of the member.
     */
    async getAnyASMemberInRoom(roomId, preferBot = true) {
        if (!this.registration) {
            throw Error('Registration must be defined before you can call this');
        }
        let members = this.membershipCache.getMembersForRoom(roomId, "join");
        if (!members) {
            if (!this.botIntent) {
                throw Error('AS Bot not defined yet');
            }
            members = await this.botIntent.botSdkIntent.underlyingClient.getJoinedRoomMembers(roomId);
        }
        if (preferBot && members?.includes(this.botUserId)) {
            return this.botUserId;
        }
        const reg = this.registration;
        return members.find((u) => reg.isUserMatch(u, false)) || null;
    }
    async validateEditEvent(event, parentEventId, allowEventOnLookupFail) {
        try {
            const roomMember = await this.getAnyASMemberInRoom(event.room_id);
            if (!roomMember) {
                throw Error('No member in room, cannot handle edit');
            }
            const relatedEvent = await this.getIntent(roomMember).getEvent(event.room_id, parentEventId, true);
            // Only allow edits from the same sender
            if (relatedEvent.sender !== event.sender) {
                log.warn(`Rejecting ${event.event_id}: Message edit sender did NOT match the original message (${parentEventId})`);
                return false;
            }
        }
        catch (ex) {
            if (!allowEventOnLookupFail) {
                log.warn(`Rejecting ${event.event_id}: Unable to fetch parent event ${parentEventId}`, ex);
                return false;
            }
            log.warn(`Allowing event ${event.event_id}: Unable to fetch parent event ${parentEventId}`, ex);
        }
        return true;
    }
    // returns a Promise for the request linked to this event for testing.
    async onEvent(event) {
        if (!this.registration) {
            // Called before we were ready, which is probably impossible.
            return null;
        }
        if (this.selfPingDeferred?.roomId === event.room_id && event.sender === this.botUserId) {
            this.selfPingDeferred.defer.resolve();
            log.debug("Got self ping");
            return null;
        }
        const isCanonicalState = event.state_key === "";
        this.updateIntents(event);
        if (this.opts.suppressEcho &&
            (this.registration.isUserMatch(event.sender, true) ||
                event.sender === this.botUserId)) {
            return null;
        }
        if (this.activityTracker && event.sender && event.origin_server_ts) {
            this.activityTracker.setLastActiveTime(event.sender);
        }
        // eslint-disable-next-line camelcase
        const relatesTo = event.content?.['m.relates_to'];
        const editOptions = this.opts.eventValidation?.validateEditSender;
        if (event.type === 'm.room.message' &&
            relatesTo?.rel_type === 'm.replace' &&
            relatesTo.event_id &&
            editOptions) {
            // Event rejected.
            if (!await this.validateEditEvent(event, relatesTo.event_id, editOptions.allowEventOnLookupFail)) {
                return null;
            }
        }
        if (this.roomUpgradeHandler && this.opts.roomUpgradeOpts && this.appServiceBot) {
            // m.room.tombstone is the event that signals a room upgrade.
            if (event.type === "m.room.tombstone" && isCanonicalState && this.roomUpgradeHandler) {
                // eslint-disable-next-line camelcase
                this.roomUpgradeHandler.onTombstone({ ...event, content: event.content });
                if (this.opts.roomUpgradeOpts.consumeEvent) {
                    return null;
                }
            }
            else if (event.type === "m.room.member" &&
                event.state_key === this.appServiceBot.getUserId() &&
                event.content.membership === "invite") {
                // A invite-only room that has been upgraded won't have been joinable,
                // so we are listening for any invites to the new room.
                const isUpgradeInvite = await this.roomUpgradeHandler.onInvite(event);
                if (isUpgradeInvite &&
                    this.opts.roomUpgradeOpts.consumeEvent) {
                    return null;
                }
            }
        }
        const request = this.requestFactory.newRequest({ data: event });
        const contextReady = this.getBridgeContext(event);
        const dataReady = contextReady.then(context => ({ request, context }));
        const dataReadyLimited = this.limited(dataReady);
        this.queue.push(event, dataReadyLimited);
        this.queue.consume();
        const reqPromise = request.getPromise();
        // We *must* return the result of the request.
        try {
            return await reqPromise;
        }
        catch (ex) {
            if (ex instanceof EventNotHandledError) {
                this.handleEventError(event, ex);
            }
            throw ex;
        }
    }
    /**
     * Restricts the promise according to the bridges `perRequest` setting.
     *
     * `perRequest` enabled:
     *     Returns a promise similar to `promise`, with the addition of it only
     *     resolving after `request`.
     * `perRequest` disabled:
     *     Returns the promise unchanged.
     */
    async limited(promise) {
        // queue.perRequest controls whether multiple request can be processed by
        // the bridge at once.
        if (this.opts.queue?.perRequest) {
            const promiseLimited = (async () => {
                try {
                    // We don't care about the results
                    await this.prevRequestPromise;
                }
                finally {
                    return promise;
                }
            })();
            this.prevRequestPromise = promiseLimited;
            return promiseLimited;
        }
        return promise;
    }
    onConsume(err, data) {
        if (err) {
            // The data for the event could not be retrieved.
            this.onLog("onEvent failure: " + err, true);
            return;
        }
        this.opts.controller.onEvent(data.request, data.context);
    }
    // eslint-disable-next-line camelcase
    async getBridgeContext(event) {
        if (this.opts.disableContext) {
            return null;
        }
        if (!this.roomStore || !this.userStore) {
            throw Error('Cannot call getBridgeContext before loading databases');
        }
        const context = new bridge_context_1.BridgeContext({
            sender: event.sender,
            target: event.type === "m.room.member" ? event.state_key : undefined,
            room: event.room_id
        });
        return context.get(this.roomStore, this.userStore);
    }
    // eslint-disable-next-line camelcase
    handleEventError(event, error) {
        if (!this.botIntent) {
            throw Error('Cannot call handleEventError before calling .run()');
        }
        if (!(error instanceof EventNotHandledError)) {
            error = wrapError(error, BridgeInternalError);
        }
        // TODO[V02460@gmail.com]: Send via different means when the bridge bot is
        // unavailable. _MSC2162: Signaling Errors at Bridges_ will have details on
        // how this should be done.
        this.botIntent.unstableSignalBridgeError(event.room_id, event.event_id, this.opts.networkName, error.reason, this.getUserRegex());
    }
    /**
     * Returns a regex matching all users of the bridge.
     * @return Super regex composed of all user regexes.
     */
    getUserRegex() {
        // Return empty array if registration isn't available yet.
        return this.registration?.getOutput()?.namespaces?.users?.map(o => o.regex) || [];
    }
    updateIntents(event) {
        if (event.type === "m.room.member" && event.state_key) {
            const content = event.content;
            const profile = {};
            if (content && content.displayname) {
                profile.displayname = content.displayname;
            }
            if (content && content.avatar_url) {
                profile.avatar_url = content.avatar_url;
            }
            this.membershipCache.setMemberEntry(event.room_id, event.state_key, content ? content.membership : null, profile);
        }
        else if (event.type === "m.room.power_levels") {
            const content = event.content;
            this.setPowerLevelEntry(event.room_id, content);
        }
    }
    setPowerLevelEntry(roomId, content) {
        this.powerlevelMap.set(roomId, content);
    }
    getPowerLevelEntry(roomId) {
        return this.powerlevelMap.get(roomId);
    }
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
    getPrometheusMetrics(registerEndpoint = true, registry) {
        if (this.metrics) {
            return this.metrics;
        }
        const metrics = this.metrics = new prometheusmetrics_1.PrometheusMetrics(registry);
        if (this.botSdkAS) {
            metrics.registerMatrixSdkMetrics(this.botSdkAS);
        } // Else, we will set this up in initialise()
        if (registerEndpoint && this.appservice) {
            metrics.addAppServicePath(this);
        } // Else, we will add the path in listen()
        return metrics;
    }
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
    registerBridgeGauges(counterFunc) {
        this.getPrometheusMetrics().registerBridgeGauges(async () => {
            const counts = await counterFunc();
            if (counts.matrixGhosts !== undefined) {
                counts.matrixGhosts = Object.keys(this.intents.size).length;
            }
            if (counts.rmau !== undefined) {
                counts.rmau = this.opts.controller.userActivityTracker?.countActiveUsers().allUsers;
            }
            return counts;
        });
    }
    /**
     * Check a express Request to see if it's correctly
     * authenticated (includes the hsToken). The query parameter `access_token`
     * and the `Authorization` header are checked.
     * @returns {Boolean} True if authenticated, False if not.
     */
    requestCheckToken(req) {
        if (!this.registration) {
            // Bridge isn't ready yet
            return false;
        }
        if (req.query.access_token !== this.registration.getHomeserverToken() &&
            req.get("authorization") !== `Bearer ${this.registration.getHomeserverToken()}`) {
            return false;
        }
        return true;
    }
    /**
     * Close the appservice HTTP listener, and clear all timeouts.
     * @returns Resolves when the appservice HTTP listener has stopped
     */
    async close() {
        if (this.intentLastAccessedTimeout) {
            clearTimeout(this.intentLastAccessedTimeout);
            this.intentLastAccessedTimeout = null;
        }
        if (this.appservice) {
            await this.appservice.close();
            this.appservice = undefined;
        }
        if (this.eeEventBroker) {
            this.eeEventBroker.close();
        }
        if (this.selfPingDeferred?.timeout) {
            clearInterval(this.selfPingDeferred.timeout);
            this.selfPingDeferred = undefined;
        }
        this.requestFactory.close();
    }
    async checkHomeserverSupport() {
        if (!this.botSdkAS) {
            throw Error("botSdkAS isn't ready yet");
        }
        // Min required version
        if (this.opts.bridgeEncryption) {
            // Ensure that we have support for /login
            const loginFlows = await this.botSdkAS.botClient.doRequest("GET", "/_matrix/client/v3/login");
            if (!encryption_1.EncryptedEventBroker.supportsLoginFlow(loginFlows)) {
                throw Error('To enable support for encryption, your homeserver must support m.login.application_service.' +
                    ' This was introduced in Matrix 1.2.');
            }
        }
    }
    /**
     * Check the homeserver -> appservice connection by
     * sending a ping event.
     * @param roomId The room to use as a ping check.
     * @param timeoutMs How long to wait for the ping attempt. Defaults to 60s.
     * @throws This will throw if another ping attempt is made, or if the request times out.
     * @returns The delay in milliseconds
     */
    async pingAppserviceRoute(roomId, timeoutMs = exports.BRIDGE_PING_TIMEOUT_MS) {
        if (!this.botIntent) {
            throw Error("botIntent isn't ready yet");
        }
        const sentTs = Date.now();
        if (this.selfPingDeferred) {
            this.selfPingDeferred.defer.reject(new Error("Another ping request is being made. Cancelling this one."));
        }
        this.selfPingDeferred = {
            defer: (0, promiseutil_1.defer)(),
            roomId,
            timeout: setTimeout(() => {
                this.selfPingDeferred?.defer.reject(new Error("Timeout waiting for ping event"));
            }, timeoutMs),
        };
        await this.botIntent.sendEvent(roomId, exports.BRIDGE_PING_EVENT_TYPE, {
            sentTs,
        });
        await this.selfPingDeferred.defer.promise;
        clearTimeout(this.selfPingDeferred.timeout);
        return Date.now() - sentTs;
    }
    updateRoomLinkValidatorRules(rules) {
        this.roomLinkValidator?.updateRules(rules);
    }
    onIntentCreate(userId, intentOpts, encOpts) {
        if (!this.botSdkAS) {
            throw Error('botSdkAS must be defined before onIntentCreate can be called');
        }
        const isBot = this.botUserId === userId;
        const botIntent = isBot ? this.botSdkAS.botIntent : this.botSdkAS.getIntentForUserId(userId);
        if (encOpts) {
            return new encrypted_intent_1.EncryptedIntent(botIntent, this.botSdkAS.botClient, intentOpts, encOpts);
        }
        return new intent_1.Intent(botIntent, this.botSdkAS.botClient, intentOpts);
    }
    onEphemeralActivity(event) {
        if (!this.activityTracker) {
            // Not in use.
            return;
        }
        // If we see one of these events over federation, bump the
        // last active time for those users.
        let userIds = undefined;
        if (!this.activityTracker) {
            return;
        }
        if (event.type === "m.presence" && event.content.presence === "online") {
            userIds = [event.sender];
        }
        else if (event.type === "m.receipt") {
            userIds = [];
            const currentTime = Date.now();
            // The homeserver will send us a map of all userIDs => ts for each event.
            // We are only interested in recent receipts though.
            for (const eventData of Object.values(event.content).map((v) => v["m.read"])) {
                for (const [userId, { ts }] of Object.entries(eventData)) {
                    if (currentTime - ts <= RECEIPT_CUTOFF_TIME_MS) {
                        userIds.push(userId);
                    }
                }
            }
        }
        else if (event.type === "m.typing") {
            userIds = event.content.user_ids;
        }
        if (userIds) {
            for (const userId of userIds) {
                this.activityTracker.setLastActiveTime(userId);
            }
        }
    }
}
exports.Bridge = Bridge;
async function loadDatabase(path, Cls) {
    try {
        const datastoreFn = (await import("nedb")).default;
        return new Promise((resolve, reject) => {
            const dbInstance = new datastoreFn({
                filename: path,
                autoload: true,
                onload: function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(new Cls(dbInstance));
                    }
                }
            });
        });
    }
    catch (ex) {
        throw Error('nedb could not be imported. You will need to add this package as a peer dependency.');
    }
}
//# sourceMappingURL=bridge.js.map