/**
 * Caches membership of virtual users to rooms in memory
 * and also stores the state of whether users are registered.
 */
export type UserMembership = "join" | "invite" | "leave" | "ban" | null;
export type UserProfile = {
    displayname?: string;
    avatar_url?: string;
};
export declare class MembershipCache {
    private membershipCache;
    private registeredUsers;
    /**
     * Gets the *cached* state of a user's membership for a room.
     * This DOES NOT check to verify the value is correct (i.e the
     * room may have state reset and left the user from the room).
     *
     * This only caches users from the appservice.
     *
     * @param roomId Room id to check the state of.
     * @param userId The userid to check the state of.
     * @returns The membership state of the user, e.g. "joined"
     */
    getMemberEntry(roomId: string, userId: string): UserMembership;
    /**
     * Gets the *cached* state of a user's membership for a room.
     * This DOES NOT check to verify the value is correct (i.e the
     * room may have state reset and left the user from the room).
     *
     * This only caches users from the appservice.
     *
     * @param roomId Room id to check the state of.
     * @param userId The userid to check the state of.
     * @returns The member's profile information.
     */
    getMemberProfile(roomId: string, userId: string): UserProfile;
    /**
     * Set the *cached* state of a user's membership for a room.
     * Use this to optimise intents so that they do not attempt
     * to join a room if we know they are joined.
     * This DOES NOT set the actual membership of the room.
     *
     * This only caches users from the appservice.
     * @param roomId Room id to set the state of.
     * @param userId The userid to set the state of.
     * @param membership The membership value to set for the user
     *                       e.g joined.
     */
    setMemberEntry(roomId: string, userId: string, membership: UserMembership, profile: UserProfile): void;
    /**
     * Is a user considered registered with the homeserver.
     * @param userId A Matrix userId
     */
    isUserRegistered(userId: string): boolean;
    getMembersForRoom(roomId: string, filterFor?: UserMembership): string[] | null;
}
