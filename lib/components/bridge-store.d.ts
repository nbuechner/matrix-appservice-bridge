import type Datastore from "nedb";
type Query = Record<string, unknown>;
/**
 * Base class for bridge stores.
 */
export declare class BridgeStore {
    readonly db: Datastore;
    private dbInsert;
    private dbUpdate;
    private dbRemove;
    private dbFindOne;
    private dbFind;
    constructor(db: Datastore);
    /**
     * INSERT a multiple documents.
     */
    insert(objects: unknown): Promise<any[]>;
    /**
     * UPSERT a single document
     */
    upsert<T>(query: Query, updateVals: T): Promise<void>;
    /**
     * INSERT IF NOT EXISTS a single document
     */
    insertIfNotExists(query: Query, insertObj: Record<string, unknown>): Promise<void>;
    /**
     * UPDATE a single document. If the document already exists, this will NOT update
     * it.
     */
    update(query: Query, updateVals: Record<string, unknown>): Promise<void>;
    /**
     * DELETE multiple documents.
     */
    delete(query: Query): Promise<number>;
    /**
     * SELECT a single document.
     */
    selectOne<T, O>(query: Query, transformFn?: (input: T) => O): Promise<O | null>;
    /**
     * SELECT a number of documents.
     * @param query
     * @param transformFn
     * @param defer
     */
    select<T, O>(query: Query, transformFn?: (input: T) => O): Promise<O[]>;
    /**
     * Set a UNIQUE key constraint on the given field.
     * @param fieldName The field name. Use dot notation for nested objects.
     * @param sparse Allow sparse entries (undefined won't cause a key
     * violation).
     */
    setUnique(fieldName: string, sparse?: boolean): void;
    /**
     * Convenience method to convert a document to something.
     * @param func The function which will be called with a single document
     * object. Guaranteed not to be null.
     * @return A `transformFn` function to pass to the standard
     * select/delete/upsert/etc methods.
     */
    convertTo<T, O>(func: (input: T) => O): (doc: T) => O;
}
export {};
