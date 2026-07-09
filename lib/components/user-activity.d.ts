interface UserActivityMetadata {
    /**
     * The user is active in "private" rooms. Undefined if not.
     */
    private?: true;
    /**
     * The user was previously active, so we don't have a grace period.
     */
    active?: true;
}
export type UserActivitySet = Map<string, UserActivity>;
export interface UserActivity {
    ts: number[];
    metadata: UserActivityMetadata;
}
export interface UserActivityTrackerConfig {
    inactiveAfterDays: number;
    minUserActiveDays: number;
    debounceTimeMs: number;
}
export declare namespace UserActivityTrackerConfig {
    const DEFAULT: UserActivityTrackerConfig;
}
export interface UserActivityState {
    dataSet: UserActivitySet;
    changed: string[];
    activeUsers: number;
}
type ChangesCallback = (state: UserActivityState) => void;
/**
 * Track user activity and produce summaries thereof.
 *
 * This stores (manually entered through `updateUserActivity()`) timestamps of user activity,
 * with optional metadata - which is stored once per user, not timestamped,
 * and overwritten upon each update.
 *
 * Only one timestamp is kept per day, rounded to 12 AM UTC.
 * Only the last 31 timestamps are kept, with older ones being dropped.
 *
 * In metadata, `active` is a reserved key that must not be used
 * to not interfere with UserActivityTracker's operations.
 */
export declare class UserActivityTracker {
    private readonly config;
    private readonly dataSet;
    private readonly onChanges?;
    private debounceTimer;
    private debouncedChangedSet;
    constructor(config: UserActivityTrackerConfig, dataSet: UserActivitySet, onChanges?: ChangesCallback | undefined);
    updateUserActivity(userId: string, metadata?: UserActivityMetadata, dateOverride?: Date): void;
    /**
     * Return the number of users active within the number of days specified in `config.inactiveAfterDays`.
     *
     * It returns the total number of active users under `allUsers` in the returned object.
     * `privateUsers` represents those users with their `metadata.private` set to `true`
     */
    countActiveUsers(dateNow?: Date): {
        allUsers: number;
        privateUsers: number;
    };
    getUserData(userId: string): UserActivity | undefined;
}
export {};
