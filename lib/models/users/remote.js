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
exports.RemoteUser = void 0;
class RemoteUser {
    id;
    data;
    /**
     * @param identifier The unique ID for this user.
     * @param data The serialized key-value data object to assign to this user.
     * @throws If identifier is not supplied.
     */
    constructor(id, data = {}) {
        this.id = id;
        this.data = data;
        if (!id) {
            throw new Error("Missing identifier");
        }
    }
    /**
     * Get the Remote user ID.
     * @return The id
     */
    getId() {
        return this.id;
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
exports.RemoteUser = RemoteUser;
//# sourceMappingURL=remote.js.map