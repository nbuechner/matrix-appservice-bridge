type DataReady = Promise<Record<string, unknown>>;
type ConsumeCallback = (error: Error | null, event: any) => void;
/**
 * Handles the processing order of incoming Matrix events.
 *
 * Events can be pushed to the queue and will be processed when their
 * corresponding data is ready and they are at the head of line.
 * Different types of queues can be chosen for the processing order of events.
 *
 * Abstract Base Class. Use the factory method `create` to create new instances.
 */
export declare class EventQueue {
    private type;
    protected consumeFn: ConsumeCallback;
    /**
     * Private constructor.
     *
     * @constructor
     * @param {"none"|"single"|"per_room"} type The type of event queue to create.
     * @param {consumeCallback} consumeFn Function which is called when an event
     *     is consumed.
     */
    private queues;
    constructor(type: "none" | "single" | "per_room", consumeFn: ConsumeCallback);
    /**
     * Push the event and its related data to the queue.
     *
     * @param {IMatrixEvent} event The event to enqueue.
     * @param {Promise<object>} dataReady Promise containing data related to the event.
     */
    push(event: {
        room_id: string;
    }, dataReady: DataReady): void;
    private getQueue;
    /**
     * Starts consuming the queue.
     *
     * As long as events are enqueued they will continue to be consumed.
     */
    consume(): void;
    private takeNext;
    /**
     * Factory for EventQueues.
     *
     * @param {"none"|"single"|"per_room"} opts.type Type of the queue to create.
     * @param {consumeCallback} consumeFn Function which is called when an event
     *     is consumed.
     * @return {EventQueue} The newly created EventQueue.
     */
    static create(opts: {
        type: "none" | "single" | "per_room";
    }, consumeFn: ConsumeCallback): EventQueueSingle | EventQueuePerRoom | EventQueueNone;
}
/**
 * EventQueue for which all events are enqueued in their order of arrival.
 *
 * The foremost event is processed as soon as its data is available.
 */
export declare class EventQueueSingle extends EventQueue {
    constructor(consumeFn: ConsumeCallback);
}
/**
 * EventQueue for which one queue per room is utilized.
 *
 * Events at the head of line are processed as soon as their data is available.
 */
export declare class EventQueuePerRoom extends EventQueue {
    constructor(consumeFn: ConsumeCallback);
}
/**
 * Dummy EventQueue for which no queue is utilized.
 *
 * Every event is handled as soon as its data is available.
 */
export declare class EventQueueNone extends EventQueue {
    constructor(consumeFn: ConsumeCallback);
    push(event: unknown, dataReady: DataReady): void;
    consume(): void;
}
export {};
/**
 * @callback consumeCallback
 * @param {Error} [err] The error in case the data could not be retrieved.
 * @param {object} data The data associated with the consumed event.
 */
