export interface MatrixRoomData {
    name?: string;
    topic?: string;
    extras: Record<string, unknown>;
}
export declare class MatrixRoom {
    readonly roomId: string;
    name?: string;
    topic?: string;
    private _extras;
    /**
     * Create a matrix room.
     * @param roomId The room ID
     * @param data The room ID
     */
    constructor(roomId: string, data?: MatrixRoomData);
    get extras(): Record<string, unknown>;
    /**
     * Get the room ID.
     * @return The room ID
     */
    getId(): string;
    /**
     * Get the data value for the given key.
     * @param key An arbitrary bridge-specific key.
     * @return Stored data for this key. May be undefined.
     */
    get<T>(key: string): T;
    /**
     * Set an arbitrary bridge-specific data value for this room. This will be serailized
     * under an 'extras' key.
     * @param key The key to store the data value under.
     * @param val The data value. This value should be serializable via
     * <code>JSON.stringify(data)</code>.
     */
    set(key: string, val: unknown): void;
    /**
     * Serialize data about this room into a JSON object.
     * @return The serialised data
     */
    serialize(): MatrixRoomData;
    /**
     * Set data about this room from a serialized data object.
     * @param data The serialized data
     */
    deserialize(data: MatrixRoomData): void;
}
