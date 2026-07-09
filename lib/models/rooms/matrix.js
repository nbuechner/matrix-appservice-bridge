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
exports.MatrixRoom = void 0;
class MatrixRoom {
    roomId;
    name;
    topic;
    _extras = {};
    /**
     * Create a matrix room.
     * @param roomId The room ID
     * @param data The room ID
     */
    constructor(roomId, data) {
        this.roomId = roomId;
        if (data) {
            this.deserialize(data);
        }
    }
    get extras() {
        return { ...this.extras };
    }
    /**
     * Get the room ID.
     * @return The room ID
     */
    getId() {
        return this.roomId;
    }
    /**
     * Get the data value for the given key.
     * @param key An arbitrary bridge-specific key.
     * @return Stored data for this key. May be undefined.
     */
    get(key) {
        return this._extras[key];
    }
    /**
     * Set an arbitrary bridge-specific data value for this room. This will be serailized
     * under an 'extras' key.
     * @param key The key to store the data value under.
     * @param val The data value. This value should be serializable via
     * <code>JSON.stringify(data)</code>.
     */
    set(key, val) {
        this._extras[key] = val;
    }
    /**
     * Serialize data about this room into a JSON object.
     * @return The serialised data
     */
    serialize() {
        return {
            name: this.name,
            topic: this.topic,
            extras: this._extras
        };
    }
    /**
     * Set data about this room from a serialized data object.
     * @param data The serialized data
     */
    deserialize(data) {
        this.name = data.name;
        this.topic = data.topic;
        this._extras = data.extras;
    }
}
exports.MatrixRoom = MatrixRoom;
//# sourceMappingURL=matrix.js.map