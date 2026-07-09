import postgres, { PostgresType } from 'postgres';
export declare function v0Schema(sql: postgres.Sql): Promise<void>;
export interface PostgresStoreOpts extends postgres.Options<Record<string, PostgresType<unknown>>> {
    /**
     * URL to reach the database on.
     */
    url?: string;
    /**
     * Should the schema table be automatically created (the v0 schema effectively).
     * Defaults to `true`.
     */
    autocreateSchemaTable?: boolean;
}
export type SchemaUpdateFunction = (sql: postgres.Sql) => Promise<void> | void;
/**
 * PostgreSQL datastore abstraction which can be inherited by a specialised bridge class.
 *
 * @example
 * class MyBridgeStore extends PostgresStore {
 *   constructor(myurl) {
 *     super([schemav1, schemav2, schemav3], { url: myurl });
 *   }
 *
 *   async getData() {
 *     return this.sql`SELECT * FROM mytable`
 *   }
 * }
 *
 * // Which can then be used by doing
 * const store = new MyBridgeStore("postgresql://postgres_user:postgres_password@postgres");
 * store.ensureSchema();
 * const data = await store.getData();
 */
export declare abstract class PostgresStore {
    private readonly schemas;
    private readonly opts;
    private hasEnded;
    readonly sql: postgres.Sql;
    get latestSchema(): number;
    /**
     * Construct a new store.
     * @param schemas The set of schema functions to apply to a database. The ordering of this array determines the
     *                schema number.
     * @param opts Options to supply to the PostgreSQL client, such as `url`.
     */
    constructor(schemas: SchemaUpdateFunction[], opts: PostgresStoreOpts);
    /**
     * Ensure the database schema is up to date. If you supplied
     * `autocreateSchemaTable` to `opts` in the constructor, a fresh database
     * will have a `schema` table created for it.
     *
     * @throws If a schema could not be applied cleanly.
     */
    ensureSchema(): Promise<void>;
    /**
     * Clean away any resources used by the database. This is automatically
     * called before the process exits.
     */
    destroy(): Promise<void>;
    /**
     * Update the current schema version.
     * @param version
     */
    protected updateSchemaVersion(version: number): Promise<void>;
    /**
     * Get the current schema version.
     * @returns The current schema version, or `-1` if no schema table is found.
     */
    protected getSchemaVersion(): Promise<number>;
}
