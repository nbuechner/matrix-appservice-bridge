"use strict";
/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomBridgeStoreEntry = exports.RoomBridgeStore = void 0;
const bridge_store_1 = require("./bridge-store");
const matrix_1 = require("../models/rooms/matrix");
const remote_1 = require("../models/rooms/remote");
class RoomBridgeStore extends bridge_store_1.BridgeStore {
    delimiter = "    ";
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
    constructor(db) {
        super(db);
    }
    /**
     * Insert an entry, clobbering based on the ID of the entry.
     * @param entry
     */
    upsertEntry(entry) {
        return this.upsert({
            id: entry.id
        }, RoomBridgeStoreEntry.serializeEntry(entry));
    }
    /**
     * Get an existing entry based on the provided entry ID.
     * @param id The ID of the entry to retrieve.
     */
    getEntryById(id) {
        return this.selectOne({
            id: id
        }, this.convertTo((doc) => new RoomBridgeStoreEntry(doc)));
    }
    /**
     * Get a list of entries based on the matrix_id of each entry.
     * @param matrixId
     */
    getEntriesByMatrixId(matrixId) {
        return this.select({
            matrix_id: matrixId
        }, this.convertTo((doc) => new RoomBridgeStoreEntry(doc)));
    }
    /**
     * A batch version of <code>getEntriesByMatrixId</code>.
     * @param ids
     * @return Resolves to a map of room_id => Entry[]
     */
    async getEntriesByMatrixIds(ids) {
        // eslint-disable-next-line camelcase
        const docs = await this.select({
            matrix_id: {
                $in: ids
            }
        });
        if (!docs) {
            return {};
        }
        const entries = {};
        docs.forEach((doc) => {
            if (!doc.matrix_id) {
                return;
            }
            if (!entries[doc.matrix_id]) {
                entries[doc.matrix_id] = [];
            }
            entries[doc.matrix_id].push(new RoomBridgeStoreEntry(doc));
        });
        return entries;
    }
    /**
     * Get a list of entries based on the remote_id of each entry.
     * @param remoteId
     */
    getEntriesByRemoteId(remoteId) {
        return this.select({
            remote_id: remoteId
        }, this.convertTo((doc) => new RoomBridgeStoreEntry(doc)));
    }
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
    linkRooms(matrixRoom, remoteRoom, data = {}, linkId) {
        linkId = linkId || RoomBridgeStore.createUniqueId(matrixRoom.getId(), remoteRoom.getId(), this.delimiter);
        return this.upsert({
            id: linkId
        }, {
            id: linkId,
            remote_id: remoteRoom.getId(),
            matrix_id: matrixRoom.getId(),
            remote: remoteRoom.serialize(),
            matrix: matrixRoom.serialize(),
            data: data
        });
    }
    /**
     * Create an entry with only a matrix room. Sets the 'id' of the entry to the
     * Matrix room ID. If an entry already exists with this 'id', it will be replaced.
     * This function is useful if you just want to store a room with some data and not
     * worry about any mappings.
     * @param matrixRoom
     * @see RoomBridgeStore#getMatrixRoom
     */
    setMatrixRoom(matrixRoom) {
        const entry = new RoomBridgeStoreEntry({
            id: matrixRoom.getId(),
            matrix_id: matrixRoom.getId(),
            matrix: matrixRoom.serialize(),
        });
        return this.upsertEntry(entry);
    }
    /**
     * Get an entry's Matrix room based on the provided room_id. The entry MUST have
     * an 'id' of the room_id and there MUST be a Matrix room contained within the
     * entry for this to return.
     * @param roomId
     * @see RoomBridgeStore#setMatrixRoom
     */
    getMatrixRoom(roomId) {
        return this.getEntryById(roomId).then(function (e) {
            return e ? e.matrix : null;
        });
    }
    /**
     * Get all entries with the given remote_id which have a Matrix room within.
     * @param remoteId
     */
    async getLinkedMatrixRooms(remoteId) {
        const entries = await this.getEntriesByRemoteId(remoteId);
        if (!entries) {
            return [];
        }
        return entries.filter(function (e) {
            return Boolean(e.matrix);
        }).map(function (e) {
            return e.matrix;
        });
    }
    /**
     * Get all entries with the given matrix_id which have a Remote room within.
     * @param matrixId
     */
    async getLinkedRemoteRooms(matrixId) {
        const entries = await this.getEntriesByMatrixId(matrixId);
        if (!entries) {
            return [];
        }
        return entries.filter(function (e) {
            return Boolean(e.remote);
        }).map(function (e) {
            return e.remote;
        });
    }
    /**
     * A batched version of `getLinkedRemoteRooms`.
     * @param matrixIds
     * @return A mapping of room_id to RemoteRoom.
     * @see RoomBridgeStore#getLinkedRemoteRooms
     */
    async batchGetLinkedRemoteRooms(matrixIds) {
        const entryMap = await this.getEntriesByMatrixIds(matrixIds);
        const result = {};
        for (const [key, obj] of Object.entries(entryMap)) {
            result[key] = obj.filter((e) => {
                return Boolean(e.remote);
            }).map((e) => {
                return e.remote;
            });
        }
        return result;
    }
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
    getEntriesByRemoteRoomData(data) {
        Object.keys(data).forEach(function (k) {
            const query = data[k];
            delete data[k];
            data["remote." + k] = query;
        });
        return this.select(data, this.convertTo((doc) => new RoomBridgeStoreEntry(doc)));
    }
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
    getEntriesByMatrixRoomData(data) {
        Object.keys(data).forEach(function (k) {
            const query = data[k];
            delete data[k];
            data["matrix.extras." + k] = query;
        });
        return this.select(data, this.convertTo((doc) => new RoomBridgeStoreEntry(doc)));
    }
    /**
     * Get a list of entries based on the link's data value.
     * @param data The data values to retrieve based from.
     * @example
     * store.linkRooms(matrixRoom, remoteRoom, { some_key: "some_val" });
     * store.getEntriesByLinkData({
     *     some_key: "some_val"
     * });
     */
    getEntriesByLinkData(data) {
        Object.keys(data).forEach(function (k) {
            const query = data[k];
            delete data[k];
            data["data." + k] = query;
        });
        return this.select(data, this.convertTo((doc) => new RoomBridgeStoreEntry(doc)));
    }
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
    removeEntriesByRemoteRoomData(data) {
        Object.keys(data).forEach(function (k) {
            const query = data[k];
            delete data[k];
            data["remote." + k] = query;
        });
        return this.delete(data);
    }
    /**
     * Remove entries with this remote room id.
     * @param remoteId The remote id.
     * @example
     * new RemoteRoom("foobar");
     * // store the RemoteRoom and then:
     * store.removeEntriesByRemoteRoomId("foobar");
     */
    removeEntriesByRemoteRoomId(remoteId) {
        return this.delete({
            remote_id: remoteId
        });
    }
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
    removeEntriesByMatrixRoomData(data) {
        Object.keys(data).forEach(function (k) {
            const query = data[k];
            delete data[k];
            data["matrix.extras." + k] = query;
        });
        return this.delete(data);
    }
    /**
     * Remove entries with this matrix room id.
     * @param matrixId The matrix id.
     * @example
     * new MatrixRoom("!foobar:matrix.org");
     * // store the MatrixRoom and then:
     * store.removeEntriesByMatrixRoomId("!foobar:matrix.org");
     */
    removeEntriesByMatrixRoomId(matrixId) {
        return this.delete({
            matrix_id: matrixId
        });
    }
    /**
     * Remove entries based on the link's data value.
     * @param data The data to match.
     * @example
     * store.linkRooms(matrixRoom, remoteRoom, { a_key: "a_val" });
     * store.removeEntriesByLinkData({
     *     a_key: "a_val"
     * });
     */
    removeEntriesByLinkData(data) {
        Object.keys(data).forEach(function (k) {
            const query = data[k];
            delete data[k];
            data["data." + k] = query;
        });
        return this.delete(data);
    }
    /**
     * Remove an existing entry based on the provided entry ID.
     * @param id The ID of the entry to remove.
     * @example
     * store.removeEntryById("anid");
     */
    removeEntryById(id) {
        return this.delete({ id });
    }
    static createUniqueId(matrixRoomId, remoteRoomId, delimiter) {
        return (matrixRoomId || "") + delimiter + (remoteRoomId || "");
    }
}
exports.RoomBridgeStore = RoomBridgeStore;
class RoomBridgeStoreEntry {
    id;
    matrix;
    remote;
    data;
    constructor(doc) {
        this.id = doc?.id || undefined;
        // eslint-disable-next-line camelcase
        this.matrix = doc?.matrix_id ? new matrix_1.MatrixRoom(doc.matrix_id, doc.matrix) : undefined;
        // eslint-disable-next-line camelcase
        this.remote = doc?.remote_id ? new remote_1.RemoteRoom(doc.remote_id, doc.remote) : undefined;
        this.data = doc?.data || {};
    }
    // not a member function so callers can provide a POJO
    static serializeEntry(entry) {
        return {
            id: entry.id,
            remote_id: entry.remote ? entry.remote.getId() : undefined,
            matrix_id: entry.matrix ? entry.matrix.getId() : undefined,
            remote: entry.remote ? entry.remote.serialize() : undefined,
            matrix: entry.matrix ? entry.matrix.serialize() : undefined,
            data: entry.data || undefined,
        };
    }
}
exports.RoomBridgeStoreEntry = RoomBridgeStoreEntry;
//# sourceMappingURL=room-bridge-store.js.map