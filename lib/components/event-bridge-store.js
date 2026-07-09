"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
Copyright 2019 The Matrix.org Foundation C.I.C.

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
exports.EventBridgeStore = void 0;
const bridge_store_1 = require("./bridge-store");
const event_1 = require("../models/events/event");
/**
 * Construct a store suitable for event mapping information. Data is stored
 * as {@link StoredEvent}s.
 * @constructor
 * @param db The connected NEDB database instance
 */
class EventBridgeStore extends bridge_store_1.BridgeStore {
    constructor(db) { super(db); }
    /**
     * Insert an event, clobbering based on the ID of the StoredEvent.
     * @param event
     */
    upsertEvent(event) {
        return this.upsert({
            id: event.getId()
        }, event.serialize());
    }
    /**
     * Get an existing event based on the provided matrix IDs.
     * @param roomId The ID of the room.
     * @param eventId The ID of the event.
     * @return A promise which resolves to the StoredEvent or null.
     */
    getEntryByMatrixId(roomId, eventId) {
        return this.selectOne({
            "matrix.roomId": roomId,
            "matrix.eventId": eventId,
        }, (this.convertTo(function (doc) {
            return event_1.StoredEvent.deserialize(doc);
        })));
    }
    /**
     * Get an existing event based on the provided remote IDs.
     * @param roomId The ID of the room.
     * @param eventId The ID of the event.
     * @return A promise which resolves to the StoredEvent or null.
     */
    getEntryByRemoteId(roomId, eventId) {
        return this.selectOne({
            "remote.roomId": roomId,
            "remote.eventId": eventId,
        }, this.convertTo((doc) => {
            return event_1.StoredEvent.deserialize(doc);
        }));
    }
    /**
     * Remove entries based on the event data.
     * @param event The event to remove.
     */
    removeEvent(event) {
        return this.delete({
            id: event.getId(),
        });
    }
    /**
     * Remove entries based on the matrix IDs.
     * @param roomId The ID of the room.
     * @param eventId The ID of the event.
     */
    removeEventByMatrixId(roomId, eventId) {
        return this.delete({
            "matrix.roomId": roomId,
            "matrix.eventId": eventId,
        });
    }
    /**
     * Remove entries based on the matrix IDs.
     * @param roomId The ID of the room.
     * @param eventId The ID of the event.
     */
    removeEventByRemoteId(roomId, eventId) {
        return this.delete({
            "remote.roomId": roomId,
            "remote.eventId": eventId,
        });
    }
}
exports.EventBridgeStore = EventBridgeStore;
//# sourceMappingURL=event-bridge-store.js.map