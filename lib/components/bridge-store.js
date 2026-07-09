"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
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
exports.BridgeStore = void 0;
const util_1 = require("util");
/**
 * Base class for bridge stores.
 */
class BridgeStore {
    db;
    dbInsert;
    dbUpdate;
    dbRemove;
    dbFindOne;
    dbFind;
    constructor(db) {
        this.db = db;
        this.dbInsert = (0, util_1.promisify)(this.db.insert).bind(this.db);
        this.dbUpdate = (0, util_1.promisify)(this.db.update).bind(this.db);
        this.dbRemove = (0, util_1.promisify)(this.db.remove).bind(this.db);
        this.dbFindOne = (0, util_1.promisify)(this.db.findOne).bind(this.db);
        this.dbFind = (0, util_1.promisify)(this.db.find).bind(this.db);
    }
    /**
     * INSERT a multiple documents.
     */
    insert(objects) {
        return this.dbInsert([objects]);
    }
    /**
     * UPSERT a single document
     */
    upsert(query, updateVals) {
        return this.dbUpdate(query, updateVals, { upsert: true });
    }
    /**
     * INSERT IF NOT EXISTS a single document
     */
    async insertIfNotExists(query, insertObj) {
        const item = await this.selectOne(query);
        if (!item) {
            this.insert(insertObj);
        }
    }
    /**
     * UPDATE a single document. If the document already exists, this will NOT update
     * it.
     */
    update(query, updateVals) {
        return this.dbUpdate(query, updateVals, { upsert: false });
    }
    /**
     * DELETE multiple documents.
     */
    delete(query) {
        return this.dbRemove(query, { multi: true });
    }
    /**
     * SELECT a single document.
     */
    async selectOne(query, transformFn) {
        const doc = await this.dbFindOne(query);
        if (!doc) {
            return null;
        }
        if (transformFn) {
            return transformFn(doc);
        }
        return doc;
    }
    /**
     * SELECT a number of documents.
     * @param query
     * @param transformFn
     * @param defer
     */
    async select(query, transformFn) {
        const doc = await this.dbFind(query);
        if (!doc) {
            return [];
        }
        if (transformFn) {
            if (Array.isArray(doc)) {
                return doc.map(transformFn);
            }
            return [transformFn(doc)];
        }
        return doc;
    }
    /**
     * Set a UNIQUE key constraint on the given field.
     * @param fieldName The field name. Use dot notation for nested objects.
     * @param sparse Allow sparse entries (undefined won't cause a key
     * violation).
     */
    setUnique(fieldName, sparse = false) {
        this.db.ensureIndex({
            fieldName: fieldName,
            unique: true,
            sparse: sparse
        });
    }
    /**
     * Convenience method to convert a document to something.
     * @param func The function which will be called with a single document
     * object. Guaranteed not to be null.
     * @return A `transformFn` function to pass to the standard
     * select/delete/upsert/etc methods.
     */
    convertTo(func) {
        return function (doc) {
            return func(doc);
        };
    }
}
exports.BridgeStore = BridgeStore;
//# sourceMappingURL=bridge-store.js.map