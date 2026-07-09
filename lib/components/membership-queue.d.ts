import { Bridge } from "../bridge";
export interface ThinRequest {
    getId(): string;
}
interface QueueUserItem {
    type: "join" | "leave";
    kickUser?: string;
    reason?: string;
    attempts: number;
    roomId: string;
    userId: string;
    retry: boolean;
    req: ThinRequest;
    ts: number;
    ttl: number;
}
export interface MembershipQueueOpts {
    /**
     * The number of concurrent operations to perform.
     */
    concurrentRoomLimit?: number;
    /**
     * The number of attempts to retry an operation before it is discarded.
     */
    maxAttempts?: number;
    /**
     * @deprecated Use `actionDelayMs`
     */
    joinDelayMs?: number;
    /**
     * How long to delay a request for in milliseconds, multiplied by the number of attempts made
     * if a request failed.
     */
    actionDelayMs?: number;
    /**
     * @deprecated Use `maxActionDelayMs`
     */
    maxJoinDelayMs?: number;
    /**
     * The maximum number of milliseconds a request may be delayed for.
     */
    maxActionDelayMs?: number;
    /**
     * How long a request can "live" for before it is discarded in
     * milliseconds. This will override `maxAttempts`.
     */
    defaultTtlMs?: number;
}
/**
 * Default values used by the queue if not specified.
 */
export declare const DEFAULT_OPTS: MembershipQueueOptsWithDefaults;
interface MembershipQueueOptsWithDefaults extends MembershipQueueOpts {
    maxActionDelayMs: number;
    actionDelayMs: number;
    concurrentRoomLimit: number;
    defaultTtlMs: number;
    maxAttempts: number;
}
/**
 * This class sends membership changes for rooms in a linearized queue.
 * The queue is lineaized based upon the hash value of the roomId, so that two
 * operations for the same roomId may never happen concurrently.
 */
export declare class MembershipQueue {
    private bridge;
    private queues;
    private pendingGauge?;
    private processedCounter?;
    private failureReasonCounter?;
    private ageOfLastProcessedGauge?;
    private opts;
    constructor(bridge: Bridge, opts: MembershipQueueOpts);
    /**
     * This should be called after starting the bridge in order
     * to track metrics for the membership queue.
     */
    registerMetrics(): void;
    /**
     * Join a user to a room
     * @param roomId The roomId to join
     * @param userId Leave empty to act as the bot user.
     * @param req The request entry for logging context
     * @param retry Should the request retry if it fails
     * @param ttl How long should this request remain queued in milliseconds
     * before it's discarded. Defaults to `opts.defaultTtlMs`
     * @returns A promise that resolves when the membership has completed
     */
    join(roomId: string, userId: string | undefined, req: ThinRequest, retry?: boolean, ttl?: number): Promise<void>;
    /**
     * Leave OR kick a user from a room
     * @param roomId The roomId to leave
     * @param userId Leave empty to act as the bot user.
     * @param req The request entry for logging context
     * @param retry Should the request retry if it fails
     * @param reason Reason for leaving/kicking
     * @param kickUser The user to be kicked. If left blank, this will be a leave.
     * @param ttl How long should this request remain queued in milliseconds
     * before it's discarded. Defaults to `opts.defaultTtlMs`
     * @returns A promise that resolves when the membership has completed
     */
    leave(roomId: string, userId: string, req: ThinRequest, retry?: boolean, reason?: string, kickUser?: string, ttl?: number): Promise<void>;
    queueMembership(item: QueueUserItem): Promise<void>;
    private hashRoomId;
    private serviceQueue;
    private shouldRetry;
}
export {};
