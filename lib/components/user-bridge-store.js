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
exports.UserBridgeStore = void 0;
const bridge_store_1 = require("./bridge-store");
const matrix_1 = require("../models/users/matrix");
const remote_1 = require("../models/users/remote");
class UserBridgeStore extends bridge_store_1.BridgeStore {
    /**
     * Construct a store suitable for user bridging information.
     * @param db The connected NEDB database instance
     */
    constructor(db) {
        super(db);
    }
    /**
     * Retrieve a list of corresponding remote users for the given matrix user ID.
     * @param userId The Matrix user ID
     * @return Resolves to a list of Remote users.
     */
    async getRemoteUsersFromMatrixId(userId) {
        const remoteIds = await this.select({
            type: "union",
            matrix_id: userId
            // eslint-disable-next-line camelcase
        }, this.convertTo((doc) => {
            return doc.remote_id;
        }));
        return this.select({
            type: "remote",
            id: { $in: remoteIds }
        }, this.convertTo((doc) => new remote_1.RemoteUser(doc.id, doc.data)));
    }
    /**
     * Retrieve a list of corresponding matrix users for the given remote ID.
     * @param remoteId The Remote ID
     * @return Resolves to a list of Matrix users.
     */
    async getMatrixUsersFromRemoteId(remoteId) {
        const matrixUserIds = await this.select({
            type: "union",
            remote_id: remoteId
            // eslint-disable-next-line camelcase
        }, this.convertTo((doc) => {
            return doc.matrix_id;
        }));
        return this.select({
            type: "matrix",
            id: { $in: matrixUserIds }
        }, this.convertTo((doc) => new matrix_1.MatrixUser(doc.id, doc.data)));
    }
    /**
     * Retrieve a MatrixUser based on their user ID localpart. If there is more than
     * one match (e.g. same localpart, different domains) then this will return an
     * arbitrary matching user.
     * @param localpart The user localpart
     * @return Resolves to a MatrixUser or null.
     */
    getByMatrixLocalpart(localpart) {
        return this.selectOne({
            type: "matrix",
            "data.localpart": localpart
        }, this.convertTo((doc) => new matrix_1.MatrixUser(doc.id, doc.data)));
    }
    /**
     * Get a matrix user by their user ID.
     * @param userId The user_id
     * @return Resolves to the user or null if they
     * do not exist. Rejects with an error if there was a problem querying the store.
     */
    getMatrixUser(userId) {
        return this.selectOne({
            type: "matrix",
            id: userId
        }, this.convertTo((doc) => new matrix_1.MatrixUser(doc.id, doc.data)));
    }
    /**
     * Store a Matrix user. If they already exist, they will be updated. Equivalence
     * is determined by their user ID.
     * @param matrixUser The matrix user
     */
    setMatrixUser(matrixUser) {
        return this.upsert({
            type: "matrix",
            id: matrixUser.getId()
        }, {
            type: "matrix",
            id: matrixUser.getId(),
            data: matrixUser.serialize()
        });
    }
    /**
     * Get a remote user by their remote ID.
     * @param id The remote ID
     * @return Resolves to the user or null if they
     * do not exist. Rejects with an error if there was a problem querying the store.
     */
    getRemoteUser(id) {
        return this.selectOne({
            type: "remote",
            id: id
        }, this.convertTo((doc) => new remote_1.RemoteUser(doc.id, doc.data)));
    }
    /**
     * Get remote users by some data about them, previously stored via the set
     * method on the Remote user.
     * @param dataQuery The keys and matching values the remote users share.
     * This should use dot notation for nested types. For example:
     * <code> { "topLevel.midLevel.leaf": 42, "otherTopLevel": "foo" } </code>
     * @return Resolves to a possibly empty list of
     * RemoteUsers. Rejects with an error if there was a problem querying the store.
     * @throws If dataQuery isn't an object.
     * @example
     * remoteUser.set({
     *   toplevel: "foo",
     *   nested: {
     *     bar: {
     *       baz: 43
     *     }
     *   }
     * });
     * store.setRemoteUser(remoteUser).then(function() {
     *   store.getByRemoteData({
     *     "toplevel": "foo",
     *     "nested.bar.baz": 43
     *   })
     * });
     */
    getByRemoteData(dataQuery) {
        if (typeof dataQuery !== "object") {
            throw new Error("Data query must be an object.");
        }
        const query = {};
        Object.keys(dataQuery).forEach((key) => {
            query["data." + key] = dataQuery[key];
        });
        query.type = "remote";
        return this.select(query, this.convertTo((doc) => new remote_1.RemoteUser(doc.id, doc.data)));
    }
    /**
     * Get Matrix users by some data about them, previously stored via the set
     * method on the Matrix user.
     * @param dataQuery The keys and matching values the remote users share.
     * This should use dot notation for nested types. For example:
     * <code> { "topLevel.midLevel.leaf": 42, "otherTopLevel": "foo" } </code>
     * @return Resolves to a possibly empty list of
     * MatrixUsers. Rejects with an error if there was a problem querying the store.
     * @throws If dataQuery isn't an object.
     * @example
     * matrixUser.set({
     *   toplevel: "foo",
     *   nested: {
     *     bar: {
     *       baz: 43
     *     }
     *   }
     * });
     * store.setMatrixUser(matrixUser).then(function() {
     *   store.getByMatrixData({
     *     "toplevel": "foo",
     *     "nested.bar.baz": 43
     *   })
     * });
     */
    getByMatrixData(dataQuery) {
        if (typeof dataQuery !== "object") {
            throw new Error("Data query must be an object.");
        }
        const query = {};
        Object.keys(dataQuery).forEach((key) => {
            query["data." + key] = dataQuery[key];
        });
        query.type = "matrix";
        return this.select(query, this.convertTo((doc) => new matrix_1.MatrixUser(doc.id, doc.data)));
    }
    /**
     * Store a Remote user. If they already exist, they will be updated. Equivalence
     * is determined by the Remote ID.
     * @param remoteUser The remote user
     */
    setRemoteUser(remoteUser) {
        return this.upsert({
            type: "remote",
            id: remoteUser.getId()
        }, {
            type: "remote",
            id: remoteUser.getId(),
            data: remoteUser.serialize()
        });
    }
    /**
     * Create a link between a matrix and remote user. If either user does not exist,
     * they will be inserted prior to linking. This is done to ensure foreign key
     * constraints are satisfied (so you cannot have a mapping to a user ID which
     * does not exist).
     * @param matrixUser The matrix user
     * @param remoteUser The remote user
     */
    async linkUsers(matrixUser, remoteUser) {
        await this.insertIfNotExists({
            type: "remote",
            id: remoteUser.getId()
        }, {
            type: "remote",
            id: remoteUser.getId(),
            data: remoteUser.serialize()
        });
        await this.insertIfNotExists({
            type: "matrix",
            id: matrixUser.getId()
        }, {
            type: "matrix",
            id: matrixUser.getId(),
            data: matrixUser.serialize()
        });
        return this.upsert({
            type: "union",
            remote_id: remoteUser.getId(),
            matrix_id: matrixUser.getId()
        }, {
            type: "union",
            remote_id: remoteUser.getId(),
            matrix_id: matrixUser.getId()
        });
    }
    /**
     * Delete a link between a matrix user and a remote user.
     * @param matrixUser The matrix user
     * @param remoteUser The remote user
     * @return Resolves to the number of entries removed.
     */
    unlinkUsers(matrixUser, remoteUser) {
        return this.unlinkUserIds(matrixUser.getId(), remoteUser.getId());
    }
    /**
     * Delete a link between a matrix user ID and a remote user ID.
     * @param matrixUserId The matrix user ID
     * @param remoteUserId The remote user ID
     * @return Resolves to the number of entries removed.
     */
    unlinkUserIds(matrixUserId, remoteUserId) {
        return this.delete({
            type: "union",
            remote_id: remoteUserId,
            matrix_id: matrixUserId
        });
    }
    /**
     * Retrieve a list of matrix user IDs linked to this remote ID.
     * @param remoteId The remote ID
     * @return A list of user IDs.
     */
    getMatrixLinks(remoteId) {
        return this.select({
            type: "union",
            remote_id: remoteId
            // eslint-disable-next-line camelcase
        }, this.convertTo((doc) => doc.matrix_id));
    }
    /**
     * Retrieve a list of remote IDs linked to this matrix user ID.
     * @param matrixId The matrix user ID
     * @return A list of remote IDs.
     */
    getRemoteLinks(matrixId) {
        return this.select({
            type: "union",
            matrix_id: matrixId
            // eslint-disable-next-line camelcase
        }, this.convertTo((doc) => doc.remote_id));
    }
}
exports.UserBridgeStore = UserBridgeStore;
//# sourceMappingURL=user-bridge-store.js.map