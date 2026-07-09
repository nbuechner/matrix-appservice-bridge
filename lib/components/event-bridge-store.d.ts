import type Datastore from "nedb";
import { BridgeStore } from "./bridge-store";
import { StoredEvent } from "../models/events/event";
/**
 * Construct a store suitable for event mapping information. Data is stored
 * as {@link StoredEvent}s.
 * @constructor
 * @param db The connected NEDB database instance
 */
export declare class EventBridgeStore extends BridgeStore {
    constructor(db: Datastore);
    /**
     * Insert an event, clobbering based on the ID of the StoredEvent.
     * @param event
     */
    upsertEvent(event: StoredEvent): Promise<void>;
    /**
     * Get an existing event based on the provided matrix IDs.
     * @param roomId The ID of the room.
     * @param eventId The ID of the event.
     * @return A promise which resolves to the StoredEvent or null.
     */
    getEntryByMatrixId(roomId: string, eventId: string): Promise<StoredEvent | null>;
    /**
     * Get an existing event based on the provided remote IDs.
     * @param roomId The ID of the room.
     * @param eventId The ID of the event.
     * @return A promise which resolves to the StoredEvent or null.
     */
    getEntryByRemoteId(roomId: string, eventId: string): Promise<StoredEvent | null>;
    /**
     * Remove entries based on the event data.
     * @param event The event to remove.
     */
    removeEvent(event: StoredEvent): Promise<number>;
    /**
     * Remove entries based on the matrix IDs.
     * @param roomId The ID of the room.
     * @param eventId The ID of the event.
     */
    removeEventByMatrixId(roomId: string, eventId: string): Promise<number>;
    /**
     * Remove entries based on the matrix IDs.
     * @param roomId The ID of the room.
     * @param eventId The ID of the event.
     */
    removeEventByRemoteId(roomId: string, eventId: string): Promise<number>;
}
