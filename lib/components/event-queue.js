"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventQueueNone = exports.EventQueuePerRoom = exports.EventQueueSingle = exports.EventQueue = void 0;
/**
 * Handles the processing order of incoming Matrix events.
 *
 * Events can be pushed to the queue and will be processed when their
 * corresponding data is ready and they are at the head of line.
 * Different types of queues can be chosen for the processing order of events.
 *
 * Abstract Base Class. Use the factory method `create` to create new instances.
 */
class EventQueue {
    type;
    consumeFn;
    /**
     * Private constructor.
     *
     * @constructor
     * @param {"none"|"single"|"per_room"} type The type of event queue to create.
     * @param {consumeCallback} consumeFn Function which is called when an event
     *     is consumed.
     */
    queues = {};
    constructor(type, consumeFn) {
        this.type = type;
        this.consumeFn = consumeFn;
    }
    /**
     * Push the event and its related data to the queue.
     *
     * @param {IMatrixEvent} event The event to enqueue.
     * @param {Promise<object>} dataReady Promise containing data related to the event.
     */
    // eslint-disable-next-line camelcase
    push(event, dataReady) {
        const queue = this.getQueue(event);
        queue.events.push({
            dataReady: dataReady
        });
    }
    // eslint-disable-next-line camelcase
    getQueue(event) {
        const identifier = this.type === "per_room" ? event.room_id : "none";
        if (!this.queues[identifier]) {
            this.queues[identifier] = {
                events: [],
                consuming: false
            };
        }
        return this.queues[identifier];
    }
    /**
     * Starts consuming the queue.
     *
     * As long as events are enqueued they will continue to be consumed.
     */
    consume() {
        Object.keys(this.queues).forEach((identifier) => {
            if (!this.queues[identifier].consuming) {
                this.queues[identifier].consuming = true;
                this.takeNext(identifier);
            }
        });
    }
    takeNext(identifier) {
        const events = this.queues[identifier].events;
        const entry = events.shift();
        if (!entry) {
            this.queues[identifier].consuming = false;
            return;
        }
        entry.dataReady.then((r) => this.consumeFn(null, r)).catch((error) => this.consumeFn(error, null));
        entry.dataReady.finally(() => this.takeNext(identifier));
    }
    /**
     * Factory for EventQueues.
     *
     * @param {"none"|"single"|"per_room"} opts.type Type of the queue to create.
     * @param {consumeCallback} consumeFn Function which is called when an event
     *     is consumed.
     * @return {EventQueue} The newly created EventQueue.
     */
    static create(opts, consumeFn) {
        const type = opts.type;
        /* eslint-disable @typescript-eslint/no-use-before-define */
        if (type == "single") {
            return new EventQueueSingle(consumeFn);
        }
        if (type == "per_room") {
            return new EventQueuePerRoom(consumeFn);
        }
        if (type == "none") {
            return new EventQueueNone(consumeFn);
        }
        /* eslint-enable @typescript-eslint/no-use-before-define */
        throw Error(`Invalid EventQueue type '${type}'.`);
    }
}
exports.EventQueue = EventQueue;
/**
 * EventQueue for which all events are enqueued in their order of arrival.
 *
 * The foremost event is processed as soon as its data is available.
 */
class EventQueueSingle extends EventQueue {
    constructor(consumeFn) {
        super("single", consumeFn);
    }
}
exports.EventQueueSingle = EventQueueSingle;
/**
 * EventQueue for which one queue per room is utilized.
 *
 * Events at the head of line are processed as soon as their data is available.
 */
class EventQueuePerRoom extends EventQueue {
    constructor(consumeFn) {
        super("per_room", consumeFn);
    }
}
exports.EventQueuePerRoom = EventQueuePerRoom;
/**
 * Dummy EventQueue for which no queue is utilized.
 *
 * Every event is handled as soon as its data is available.
 */
class EventQueueNone extends EventQueue {
    constructor(consumeFn) {
        super("none", consumeFn);
    }
    push(event, dataReady) {
        // consume the event instantly
        dataReady.then((r) => this.consumeFn(null, r)).catch((error) => this.consumeFn(error, null));
    }
    consume() {
        // no-op for EventQueueNone
    }
}
exports.EventQueueNone = EventQueueNone;
/**
 * @callback consumeCallback
 * @param {Error} [err] The error in case the data could not be retrieved.
 * @param {object} data The data associated with the consumed event.
 */
//# sourceMappingURL=event-queue.js.map