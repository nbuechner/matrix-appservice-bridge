import { MatrixClient } from "@vector-im/matrix-bot-sdk";
export interface ActivityTrackerOpts {
    /**
     * Matrix server name. Used for determining local and remote users.
     * @example matrix.org
     */
    serverName: string;
    /**
     * Should the tracker assume offline or online if it doesn't have enough information.
     */
    defaultOnline: boolean;
    /**
     * Should presence be used. Set to false if the homeserver has presence disabled.
     */
    usePresence?: boolean;
    /**
     * Run a function when the last active time for a user gets updated
     */
    onLastActiveTimeUpdated?: (userId: string, ts: number) => void | Promise<void>;
}
/**
 * This class provides a "one stop shop" to determine if a user is online. It uses a combination of a
 * local cache, presence endpoints and admin APIs in that order.
 */
export declare class ActivityTracker {
    private readonly client;
    private opts;
    private lastActiveTime;
    private canUseWhois;
    constructor(client: MatrixClient, opts: ActivityTrackerOpts);
    get usingWhois(): boolean | null;
    /**
     * Sets the last active time of the user to `ts`. By default this is the current time.
     * @param userId The userId of a user who performed an action.
     * @param ts The timestamp to set in milliseconds.
     */
    setLastActiveTime(userId: string, ts?: number): void;
    /**
     * Determine if a user is online or offline using a range of metrics.
     * @param userId The userId to check
     * @param maxTimeMs The maximum time a user may be inactive for before they are considered offline.
     * @param defaultOnline Should the user be online or offline if no data is found. Defaults to `opts.defaultOnline`
     */
    isUserOnline(userId: string, maxTimeMs: number, defaultOnline?: boolean): Promise<{
        online: boolean;
        inactiveMs: number;
    }>;
}
