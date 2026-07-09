export declare class RemoteRoom {
    roomId: string;
    data: Record<string, unknown>;
    /**
     * Create a remote room.
     * @param identifier The ID for this room
     * @param data The key-value data object to assign to this room.
     */
    constructor(roomId: string, data?: Record<string, unknown>);
    /**
     * Get the room ID.
     * @return The room ID
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
