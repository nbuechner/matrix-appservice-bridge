"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresStore = void 0;
exports.v0Schema = v0Schema;
const postgres_1 = __importStar(require("postgres"));
const __1 = require("../..");
const log = new __1.Logger("PostgresStore");
async function v0Schema(sql) {
    await sql.begin(s => [
        s `CREATE TABLE schema (version	INTEGER UNIQUE NOT NULL);`,
        s `INSERT INTO schema VALUES (0);`
    ]);
}
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
class PostgresStore {
    schemas;
    opts;
    hasEnded = false;
    sql;
    get latestSchema() {
        return this.schemas.length;
    }
    /**
     * Construct a new store.
     * @param schemas The set of schema functions to apply to a database. The ordering of this array determines the
     *                schema number.
     * @param opts Options to supply to the PostgreSQL client, such as `url`.
     */
    constructor(schemas, opts) {
        this.schemas = schemas;
        this.opts = opts;
        opts.autocreateSchemaTable = opts.autocreateSchemaTable ?? true;
        this.sql = opts.url ? (0, postgres_1.default)(opts.url, opts) : (0, postgres_1.default)(opts);
        process.once("beforeExit", () => {
            // Ensure we clean up on exit
            this.destroy().catch(ex => {
                log.warn('Failed to cleanly exit', ex);
            });
        });
    }
    /**
     * Ensure the database schema is up to date. If you supplied
     * `autocreateSchemaTable` to `opts` in the constructor, a fresh database
     * will have a `schema` table created for it.
     *
     * @throws If a schema could not be applied cleanly.
     */
    async ensureSchema() {
        log.info("Starting database engine");
        let currentVersion = await this.getSchemaVersion();
        if (currentVersion === -1) {
            if (this.opts.autocreateSchemaTable) {
                log.info(`Applying v0 schema (schema table)`);
                await v0Schema(this.sql);
                currentVersion = 0;
            }
            else {
                // We aren't autocreating the schema table, so assume schema 0.
                currentVersion = 0;
            }
        }
        // Zero-indexed, so schema 1 would be in slot 0.
        while (this.schemas[currentVersion]) {
            log.info(`Updating schema to v${currentVersion + 1}`);
            const runSchema = this.schemas[currentVersion];
            try {
                await runSchema(this.sql);
                currentVersion++;
                await this.updateSchemaVersion(currentVersion);
            }
            catch (ex) {
                log.warn(`Failed to run schema v${currentVersion + 1}:`, ex);
                throw Error("Failed to update database schema");
            }
        }
        log.info(`Database schema is at version v${currentVersion}`);
    }
    /**
     * Clean away any resources used by the database. This is automatically
     * called before the process exits.
     */
    async destroy() {
        log.info("Destroy called");
        if (this.hasEnded) {
            // No-op if end has already been called.
            return;
        }
        this.hasEnded = true;
        await this.sql.end();
        log.info("PostgresSQL connection ended");
    }
    /**
     * Update the current schema version.
     * @param version
     */
    async updateSchemaVersion(version) {
        log.debug(`updateSchemaVersion: ${version}`);
        await this.sql `UPDATE schema SET version = ${version};`;
    }
    /**
     * Get the current schema version.
     * @returns The current schema version, or `-1` if no schema table is found.
     */
    async getSchemaVersion() {
        try {
            const result = await this.sql `SELECT version FROM SCHEMA;`;
            return result[0].version;
        }
        catch (ex) {
            if (ex instanceof postgres_1.PostgresError && ex.code === "42P01") { // undefined_table
                log.warn("Schema table could not be found");
                return -1;
            }
            log.error("Failed to get schema version", ex);
        }
        throw Error("Couldn't fetch schema version");
    }
}
exports.PostgresStore = PostgresStore;
//# sourceMappingURL=postgres-store.js.map