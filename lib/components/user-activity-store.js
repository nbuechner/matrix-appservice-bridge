"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
Copyright 2021 The Matrix.org Foundation C.I.C.

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
exports.UserActivityStore = void 0;
const bridge_store_1 = require("./bridge-store");
class UserActivityStore extends bridge_store_1.BridgeStore {
    /**
     * Construct a store suitable for user bridging information.
     * @param db The connected NEDB database instance
     */
    constructor(db) {
        super(db);
    }
    async storeUserActivity(mxid, activity) {
        this.upsert({ mxid }, {
            ...activity,
        });
    }
    async getActivitySet() {
        return this.select({}).then((records) => {
            const userActivity = new Map();
            for (const record of records) {
                userActivity.set(record.mxid, {
                    ts: record.ts,
                    metadata: record.metadata,
                });
            }
            return userActivity;
        });
    }
}
exports.UserActivityStore = UserActivityStore;
//# sourceMappingURL=user-activity-store.js.map