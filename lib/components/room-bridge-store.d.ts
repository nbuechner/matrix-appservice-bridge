/**
 * Room storage format:
 * {
 *   id: "matrix|remote|link_key",      // customisable
 *   matrix_id: "room_id",
 *   remote_id: "remote_room_id",
 *   matrix: { serialised matrix room info },
 *   remote: { serialised remote room info },
 *   data: { ... any additional info ... }
 * }
 *
 * Each document can either represent a matrix room, a remote room, or
 * a mapping. They look like this:
 * MATRIX
 * {
 *    id: "!room:id",
 *    matrix_id: "!room:id",
 *    matrix: { .. custom data eg name: "A happy place" .. }
 * }
 *
 * REMOTE (e.g. IRC)
 * {
 *    id: "irc.freenode.net_#channame",
 *    remote_id: "irc.freenode.net_#channame",
 *    remote: { .. custom data e.g. is_pm_room: true .. }
 * }
 *
 * MAPPING
 * {
 *    id: "!room:id__irc.freenode.net_#channame", // link key; customisable.
 *    matrix_id: "!room:id",
 *    remote_id: "irc.freenode.net_#channame",
 *    matrix: { .. custom data .. },
 *    remote: { .. custom data .. },
 *    data: { .. custom data about the mapping ..}
 * }
 *
 * A unique, non-sparse index can be set on the 'id' key, and non-unique,
 * sparse indexes can be set on matrix_id and remote_id to make mappings
 * quicker to compute.
 *
 */
import type Datastore from "nedb";
import { BridgeStore } from "./bridge-store";
import { MatrixRoom, MatrixRoomData } from "../models/rooms/matrix";
import { RemoteRoom } from "../models/rooms/remote";
export declare class RoomBridgeStore extends BridgeStore {
    delimiter: string;
    /**
     * Construct a store suitable for room bridging information. Data is stored
     * as {@link RoomBridgeStoreEntry}s which have the following
     * *serialized* format:
     * ```
     * {
     *   id: "unique_id",      // customisable
     *   matrix_id: "room_id",
     *   remote_id: "remote_room_id",
     *   matrix: { serialised matrix room info },
     *   remote: { serialised remote room info },
     *   data: { ... any additional info ... }
     * }
     * ```
     * If a unique 'id' is not given, the store will generate one by concatenating
     * the `matrix_id` and the `remote_id`. The delimiter
     * used is a property on this store and can be modified.
     *
     * The structure of Entry objects means that it is efficient to select based
     * off the 'id', 'matrix_id' or 'remote_id'. Additional indexes can be added
     * manually.
     * @constructor
     * @param db The connected NEDB database instance
     * @param opts Options for this store.
     */
    constructor(db: Datastore);
    /**
     * Insert an entry, clobbering based on the ID of the entry.
     * @param entry
     */
    upsertEntry(entry: RoomBridgeStoreEntry): Promise<void>;
    /**
     * Get an existing entry based on the provided entry ID.
     * @param id The ID of the entry to retrieve.
     */
    getEntryById(id: string): Promise<RoomBridgeStoreEntry | null>;
    /**
     * Get a list of entries based on the matrix_id of each entry.
     * @param matrixId
     */
    getEntriesByMatrixId(matrixId: string): Promise<RoomBridgeStoreEntry[]>;
    /**
     * A batch version of <code>getEntriesByMatrixId</code>.
     * @param ids
     * @return Resolves to a map of room_id => Entry[]
     */
    getEntriesByMatrixIds(ids: string[]): Promise<{
        [matrixId: string]: RoomBridgeStoreEntry[];
    }>;
    /**
     * Get a list of entries based on the remote_id of each entry.
     * @param remoteId
     */
    getEntriesByRemoteId(remoteId: string): Promise<RoomBridgeStoreEntry[]>;
    /**
     * Create a link between a matrix room and remote room. This will create an entry with:
     * - The matrix_id set to the matrix room ID.
     * - The remote_id set to the remote room ID.
     * - The id set to the id value given OR a concatenation of the matrix and remote IDs
     * if one is not provided.
     * @param matrixRoom The matrix room
     * @param remoteRoom The remote room
     * @param data Information about this mapping.
     * @param linkId The id value to set. If not given, a unique ID will be
     * created from the matrix_id and remote_id.
     */
    linkRooms(matrixRoom: MatrixRoom, remoteRoom: RemoteRoom, data?: Record<string, unknown>, linkId?: string): Promise<void>;
    /**
     * Create an entry with only a matrix room. Sets the 'id' of the entry to the
     * Matrix room ID. If an entry already exists with this 'id', it will be replaced.
     * This function is useful if you just want to store a room with some data and not
     * worry about any mappings.
     * @param matrixRoom
     * @see RoomBridgeStore#getMatrixRoom
     */
    setMatrixRoom(matrixRoom: MatrixRoom): Promise<void>;
    /**
     * Get an entry's Matrix room based on the provided room_id. The entry MUST have
     * an 'id' of the room_id and there MUST be a Matrix room contained within the
     * entry for this to return.
     * @param roomId
     * @see RoomBridgeStore#setMatrixRoom
     */
    getMatrixRoom(roomId: string): Promise<MatrixRoom | null | undefined>;
    /**
     * Get all entries with the given remote_id which have a Matrix room within.
     * @param remoteId
     */
    getLinkedMatrixRooms(remoteId: string): Promise<MatrixRoom[]>;
    /**
     * Get all entries with the given matrix_id which have a Remote room within.
     * @param matrixId
     */
    getLinkedRemoteRooms(matrixId: string): Promise<RemoteRoom[]>;
    /**
     * A batched version of `getLinkedRemoteRooms`.
     * @param matrixIds
     * @return A mapping of room_id to RemoteRoom.
     * @see RoomBridgeStore#getLinkedRemoteRooms
     */
    batchGetLinkedRemoteRooms(matrixIds: string[]): Promise<{
        [roomId: string]: RemoteRoom[];
    }>;
    /**
     * Get a list of entries based on a RemoteRoom data value.
     * @param data The data values to retrieve based from.
     * @example
     * remoteRoom.set("some_key", "some_val");
     * // store remoteRoom and then:
     * store.getEntriesByRemoteRoomData({
     *     some_key: "some_val"
     * });
     */
    getEntriesByRemoteRoomData(data: Record<string, unknown>): Promise<RoomBridgeStoreEntry[]>;
    /**
     * Get a list of entries based on a MatrixRoom data value.
     * @param data The data values to retrieve based from.
     * @example
     * matrixRoom.set("some_key", "some_val");
     * // store matrixRoom and then:
     * store.getEntriesByMatrixRoomData({
     *     some_key: "some_val"
     * });
     */
    getEntriesByMatrixRoomData(data: Record<string, unknown>): Promise<RoomBridgeStoreEntry[]>;
    /**
     * Get a list of entries based on the link's data value.
     * @param data The data values to retrieve based from.
     * @example
     * store.linkRooms(matrixRoom, remoteRoom, { some_key: "some_val" });
     * store.getEntriesByLinkData({
     *     some_key: "some_val"
     * });
     */
    getEntriesByLinkData(data: Record<string, unknown>): Promise<RoomBridgeStoreEntry[]>;
    /**
     * Remove entries based on remote room data.
     * @param data The data to match.
     * @example
     * remoteRoom.set("a_key", "a_val");
     * // store remoteRoom and then:
     * store.removeEntriesByRemoteRoomData({
     *     a_key: "a_val"
     * });
     */
    removeEntriesByRemoteRoomData(data: Record<string, unknown>): Promise<number>;
    /**
     * Remove entries with this remote room id.
     * @param remoteId The remote id.
     * @example
     * new RemoteRoom("foobar");
     * // store the RemoteRoom and then:
     * store.removeEntriesByRemoteRoomId("foobar");
     */
    removeEntriesByRemoteRoomId(remoteId: string): Promise<number>;
    /**
     * Remove entries based on matrix room data.
     * @param data The data to match.
     * @example
     * matrixRoom.set("a_key", "a_val");
     * // store matrixRoom and then:
     * store.removeEntriesByMatrixRoomData({
     *     a_key: "a_val"
     * });
     */
    removeEntriesByMatrixRoomData(data: Record<string, unknown>): Promise<number>;
    /**
     * Remove entries with this matrix room id.
     * @param matrixId The matrix id.
     * @example
     * new MatrixRoom("!foobar:matrix.org");
     * // store the MatrixRoom and then:
     * store.removeEntriesByMatrixRoomId("!foobar:matrix.org");
     */
    removeEntriesByMatrixRoomId(matrixId: string): Promise<number>;
    /**
     * Remove entries based on the link's data value.
     * @param data The data to match.
     * @example
     * store.linkRooms(matrixRoom, remoteRoom, { a_key: "a_val" });
     * store.removeEntriesByLinkData({
     *     a_key: "a_val"
     * });
     */
    removeEntriesByLinkData(data: Record<string, unknown>): Promise<number>;
    /**
     * Remove an existing entry based on the provided entry ID.
     * @param id The ID of the entry to remove.
     * @example
     * store.removeEntryById("anid");
     */
    removeEntryById(id: string): Promise<number>;
    static createUniqueId(matrixRoomId: string, remoteRoomId: string, delimiter: string): string;
}
interface RoomStoreEntryDoc {
    id?: string;
    remote_id?: string;
    matrix_id?: string;
    remote?: Record<string, unknown>;
    matrix?: MatrixRoomData;
    data?: Record<string, unknown>;
}
export declare class RoomBridgeStoreEntry {
    id?: string;
    matrix?: MatrixRoom;
    remote?: RemoteRoom;
    data: Record<string, unknown>;
    constructor(doc?: RoomStoreEntryDoc);
    static serializeEntry(entry: RoomBridgeStoreEntry): RoomStoreEntryDoc;
}
export {};
