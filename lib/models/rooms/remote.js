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
exports.RemoteRoom = void 0;
class RemoteRoom {
    roomId;
    data;
    /**
     * Create a remote room.
     * @param identifier The ID for this room
     * @param data The key-value data object to assign to this room.
     */
    constructor(roomId, data = {}) {
        this.roomId = roomId;
        this.data = data;
    }
    /**
     * Get the room ID.
     * @return The room ID
     */
    getId() {
        return this.roomId;
    }
    /**
     * Serialize all the data about this room, excluding the room ID.
     * @return The serialised data
     */
    serialize() {
        return this.data;
    }
    /**
     * Get the data value for the given key.
     * @param key An arbitrary bridge-specific key.
     * @return Stored data for this key. May be undefined.
     */
    get(key) {
        return this.data[key];
    }
    /**
     * Set an arbitrary bridge-specific data value for this room.
     * @param key The key to store the data value under.
     * @param val The data value. This value should be serializable via
     * <code>JSON.stringify(data)</code>.
     */
    set(key, val) {
        this.data[key] = val;
    }
}
exports.RemoteRoom = RemoteRoom;
//# sourceMappingURL=remote.js.map