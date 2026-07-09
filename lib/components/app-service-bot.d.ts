import { AppServiceRegistration } from "matrix-appservice";
import { MembershipCache } from "./membership-cache";
import { StateLookupEvent } from "..";
import { MatrixClient } from "@vector-im/matrix-bot-sdk";
export interface RoomInfo {
    id: string;
    state: StateLookupEvent[];
    realJoinedUsers: string[];
    remoteJoinedUsers: string[];
}
/**
 * Construct an AS bot user which has various helper methods.
 * @constructor
 * @param {MatrixClient} client The client instance configured for the AS bot.
 * @param registration The registration that the bot
 * is following. Used to determine which user IDs it is controlling.
 * @param memberCache The bridges membership cache instance,
 * for storing membership the bot has discovered.
 */
export declare class AppServiceBot {
    private client;
    private userId;
    private memberCache;
    private exclusiveUserRegexes;
    constructor(client: MatrixClient, userId: string, registration: AppServiceRegistration, memberCache: MembershipCache);
    getClient(): MatrixClient;
    getUserId(): string;
    /**
     * Get a list of joined room IDs for the AS bot.
     * @return Resolves to a list of room IDs.
     */
    getJoinedRooms(): Promise<string[]>;
    /**
     * Get a map of joined user IDs for the given room ID. The values in the map are objects
     * with a 'display_name' and 'avatar_url' properties. These properties may be null.
     * @param roomId The room to get a list of joined user IDs in.
     * @return Resolves to a map of user ID => display_name avatar_url
     */
    getJoinedMembers(roomId: string): Promise<Record<string, {
        display_name?: string;
        avatar_url?: string;
    }>>;
    getRoomInfo(roomId: string, joinedRoom?: {
        state?: {
            events: StateLookupEvent[];
        };
    }): Promise<RoomInfo>;
    /**
     * Test a userId to determine if it's a user within the exclusive regexes of the bridge.
     * @return True if it is a remote user, false otherwise.
     */
    isRemoteUser(userId: string): boolean;
}
