import { Intent } from "./intent";
interface StateLookupOpts {
    intent: Intent;
    stateLookupConcurrency?: number;
    eventTypes?: string[];
    retryStateInMs?: number;
}
interface StateLookupRoom {
    syncPromise: Promise<StateLookupRoom>;
    syncPending: boolean;
    events: {
        [eventType: string]: {
            [stateKey: string]: StateLookupEvent;
        };
    };
}
export interface StateLookupEvent {
    room_id: string;
    state_key: string;
    type: string;
    event_id: string;
    content: unknown;
}
export declare class StateLookup {
    private readonly intent;
    private readonly eventTypes;
    private readonly dict;
    private readonly lookupQueue;
    private retryStateIn;
    /**
     * Construct a new state lookup entity.
     *
     * This component stores state events for specific event types which can be
     * queried at a later date. This component will perform network requests to
     * fetch the current state for a given room ID. It relies on
     * {@link StateLookup#onEvent} being called with later events in order to
     * stay up-to-date. This should be connected to the <code>onEvent</code>
     * handler on the {@link Bridge}.
     * @constructor
     * @param {Object} opts Options for this constructor
     * @param {MatrixClient} opts.client Required. The client which will perform
     * /state requests.
     * @param {string[]} opts.eventTypes The state event types to track.
     * @throws if there is no client.
     */
    constructor(opts: StateLookupOpts);
    /**
     * Get a stored state event.
     * @param {string} roomId
     * @param {string} eventType
     * @param {string=} stateKey If specified, this function will return either
     * the event or null. If not specified, this function will always return an
     * array of events, which may be empty.
     * @return {?Object|Object[]}
     */
    getState(roomId: string, eventType: string, stateKey?: string): null | StateLookupEvent | StateLookupEvent[];
    private getInitialState;
    /**
     * Track a given room. The client must have access to this room.
     *
     * This will perform a room state query initially. Subsequent calls will do
     * nothing, as it will rely on events being pushed to it via {@link StateLookup#onEvent}.
     *
     * @param {string} roomId The room ID to start tracking. You can track multiple
     * rooms by calling this function multiple times with different room IDs.
     * @return {Promise} Resolves when the room is being tracked. Rejects if the room
     * cannot be tracked.
     */
    trackRoom(roomId: string): Promise<StateLookupRoom>;
    /**
     * Stop tracking a given room.
     *
     * This will stop further tracking of state events in the given room and delete
     * existing stored state for it.
     *
     * @param {string} roomId The room ID to stop tracking.
     */
    untrackRoom(roomId: string): void;
    /**
     * Update any state dictionaries with this event. If there is nothing tracking
     * this room, nothing is stored.
     * @param {Object} event Raw matrix event
     */
    onEvent(event: StateLookupEvent): Promise<void>;
    private insertEvent;
}
export {};
