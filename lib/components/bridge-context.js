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
exports.BridgeContext = void 0;
const matrix_1 = require("../models/users/matrix");
const matrix_2 = require("../models/rooms/matrix");
const errors_1 = require("../errors");
class BridgeContext {
    ctx;
    senders;
    targets;
    rooms;
    /**
     * @param ctx Event related data
     * @param ctx.sender Matrix user ID of the sender.
     * @param ctx.target Matrix user ID of the target.
     * @param ctx.room Matrix room ID.
     */
    constructor(ctx) {
        this.ctx = ctx;
        this.senders = {
            matrix: new matrix_1.MatrixUser(this.ctx.sender),
            remote: null,
            remotes: [],
        };
        this.targets = {
            matrix: this.ctx.target ? new matrix_1.MatrixUser(this.ctx.target) : null,
            remote: null,
            remotes: [],
        };
        this.rooms = {
            matrix: new matrix_2.MatrixRoom(this.ctx.room),
            remote: null,
            remotes: [],
        };
    }
    /**
     * Returns this instance after its initialization.
     *
     * @param {RoomBridgeStore} roomStore
     * @param {UserBridgeStore} userStore
     * @returns {Promise<BridgeContext>}
     */
    async get(roomStore, userStore) {
        try {
            const results = await Promise.all([
                roomStore.getLinkedRemoteRooms(this.ctx.room),
                userStore.getRemoteUsersFromMatrixId(this.ctx.sender),
                (this.ctx.target ?
                    userStore.getRemoteUsersFromMatrixId(this.ctx.target) :
                    Promise.resolve([])),
                roomStore.getMatrixRoom(this.ctx.room),
                userStore.getMatrixUser(this.ctx.sender),
            ]);
            const [remoteRooms, remoteSenders, remoteTargets, mxRoom, mxSender] = results;
            if (remoteRooms.length) {
                this.rooms.remotes = remoteRooms;
                this.rooms.remote = remoteRooms[0];
            }
            if (remoteSenders.length) {
                this.senders.remotes = remoteSenders;
                this.senders.remote = remoteSenders[0];
            }
            if (remoteTargets.length) {
                this.targets.remotes = remoteTargets;
                this.targets.remote = remoteTargets[0];
            }
            if (mxRoom) {
                this.rooms.matrix = mxRoom;
            }
            if (mxSender) {
                this.senders.matrix = mxSender;
            }
        }
        catch (ex) {
            throw errors_1.unstable.wrapError(ex, errors_1.unstable.EventNotHandledError, "Could not retrieve bridge context");
        }
        return this;
    }
}
exports.BridgeContext = BridgeContext;
//# sourceMappingURL=bridge-context.js.map