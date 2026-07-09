export declare class MatrixUser {
    userId: string;
    private readonly _data;
    private _localpart;
    readonly host: string;
    /**
     * Construct a Matrix user.
     * @param userId The userId of the user.
     * @param data Serialized data values
     * @param escape Escape the user's localpart. Modify {@link MatrixUser~ESCAPE_DEFAULT}
     *               to change the default value.
     */
    constructor(userId: string, _data?: Record<string, unknown>, escape?: boolean);
    get localpart(): string;
    /**
     * Get the matrix user's ID.
     * @return The user ID
     */
    getId(): string;
    /**
     * Get the display name for this Matrix user.
     * @return The display name.
     */
    getDisplayName(): string | null;
    /**
     * Set the display name for this Matrix user.
     * @param name The Matrix display name.
     */
    setDisplayName(name: string): void;
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
    /**
     * Serialize all the data about this user, excluding the user ID.
     * @return The serialised data
     */
    serialize(): {
        localpart: string;
    };
    /**
     * Make a userId conform to the matrix spec using QP escaping.
     * Grammar taken from: https://matrix.org/docs/spec/appendices.html#identifier-grammar
     */
    escapeUserId(): void;
    /**
     * @static
     * This is a global variable to modify the default escaping behaviour of MatrixUser.
     */
    static ESCAPE_DEFAULT: boolean;
}
