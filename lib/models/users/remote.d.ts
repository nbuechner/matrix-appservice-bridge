export declare class RemoteUser {
    readonly id: string;
    readonly data: Record<string, unknown>;
    /**
     * @param identifier The unique ID for this user.
     * @param data The serialized key-value data object to assign to this user.
     * @throws If identifier is not supplied.
     */
    constructor(id: string, data?: Record<string, unknown>);
    /**
     * Get the Remote user ID.
     * @return The id
     */
    getId(): string;
    /**
     * Serialize all the data about this room, excluding the room ID.
     * @return The serialised data
     */
    serialize(): Record<string, unknown>;
    /**
     * Get the data value for the given key.
     * @param key An arbitrary bridge-specific key.
     * @return Stored data for this key. May be undefined.
     */
    get<T>(key: string): T;
    /**
     * Set an arbitrary bridge-specific data value for this room.
     * @param key The key to store the data value under.
     * @param val The data value. This value should be serializable via
     * <code>JSON.stringify(data)</code>.
     */
    set(key: string, val: unknown): void;
}
