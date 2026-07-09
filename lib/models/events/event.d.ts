export interface StoredEventDoc {
    id: string;
    matrix: {
        roomId: string;
        eventId: string;
    };
    remote: {
        roomId: string;
        eventId: string;
    };
    extras: Record<string, unknown>;
}
export declare class StoredEvent {
    roomId: string;
    eventId: string;
    remoteRoomId: string;
    remoteEventId: string;
    private readonly _extras;
    /**
     * Create a store event.
     * @param roomId The matrix room ID
     * @param eventId The matrix event ID
     * @param remoteRoomId The remote room ID
     * @param remoteEventId The remote event ID
     * @param _extras Any extra data that may be included with the event.
     */
    constructor(roomId: string, eventId: string, remoteRoomId: string, remoteEventId: string, _extras?: Record<string, unknown>);
    /**
     * Get the unique ID.
     * @return A unique ID
     */
    getId(): string;
    /**
     * Get the matrix room ID.
     * @return The room ID
     */
    getMatrixRoomId(): string;
    /**
     * Get the matrix event ID.
     * @return The event ID
     */
    getMatrixEventId(): string;
    /**
     * Get the remote room ID.
     * @return The remote room ID
     */
    getRemoteRoomId(): string;
    /**
     * Get the remote event ID.
     * @return The remote event ID
     */
    getRemoteEventId(): string;
    /**
     * Get the data value for the given key.
     * @param key An arbitrary bridge-specific key.
     * @return Stored data for this key. May be undefined.
     */
    get<T>(key: string): T;
    /**
     * Set an arbitrary bridge-specific data value for this event. This will be serailized
     * under an 'extras' key.
     * @param key The key to store the data value under.
     * @param val The data value. This value should be serializable via
     * <code>JSON.stringify(data)</code>.
     */
    set(key: string, val: unknown): void;
    /**
     * Serialize data about this event into a JSON object.
     */
    serialize(): StoredEventDoc;
    /**
     * Set data about this event from a serialized data object.
     * @param data The serialized data
     */
    static deserialize(data: StoredEventDoc): StoredEvent;
}
