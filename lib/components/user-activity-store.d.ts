import type Datastore from "nedb";
import { BridgeStore } from "./bridge-store";
import { UserActivity, UserActivitySet } from "./user-activity";
export declare class UserActivityStore extends BridgeStore {
    /**
     * Construct a store suitable for user bridging information.
     * @param db The connected NEDB database instance
     */
    constructor(db: Datastore);
    storeUserActivity(mxid: string, activity: UserActivity): Promise<void>;
    getActivitySet(): Promise<UserActivitySet>;
}
