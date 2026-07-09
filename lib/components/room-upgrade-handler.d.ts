import { RoomBridgeStoreEntry } from "./room-bridge-store";
import { Bridge } from "..";
export interface RoomUpgradeHandlerOpts {
    /**
     * Should upgrade and invite events be processed after being handled
     * by the RoomUpgradeHandler. Defaults to `false`.
     */
    consumeEvent: boolean;
    /**
     * Should ghost users be migrated to the new room. This will leave
     * any users matching the user regex list in the registration file
     * from the old room, and join them to the new room.
     * Defaults to `true`
     */
    migrateGhosts: boolean;
    /**
     * Migrate room store entries automatically. Defaults to `true`
     */
    migrateStoreEntries: boolean;
    /**
     * Invoked after a room has been upgraded and its entries updated.
     *
     * @param oldRoomId The old roomId.
     * @param newRoomId The new roomId.
     */
    onRoomMigrated?: (oldRoomId: string, newRoomId: string) => Promise<void> | void;
    /**
     * Invoked when iterating around a rooms entries. Should be used to update entries
     * with a new room id.
     *
     * @param entry The existing entry.
     * @param newRoomId The new roomId.
     * @return Return the entry to upsert it,
     * or null to ignore it.
     */
    migrateEntry?: (entry: RoomBridgeStoreEntry, newRoomId: string) => Promise<RoomBridgeStoreEntry | null>;
}
/**
 * Handles migration of rooms when a room upgrade is performed.
 */
export declare class RoomUpgradeHandler {
    private readonly opts;
    private readonly bridge;
    private waitingForInvite;
    /**
     * @param {RoomUpgradeHandler~Options} opts
     * @param {Bridge} bridge The parent bridge.
     */
    constructor(opts: RoomUpgradeHandlerOpts, bridge: Bridge);
    /**
     * Called when the bridge sees a "m.room.tombstone" event.
     * @param ev The m.room.tombstone event.
     */
    onTombstone(ev: {
        sender: string;
        room_id: string;
        content: {
            replacement_room: string;
        };
    }): Promise<boolean>;
    private joinNewRoom;
    /**
     * Called when an invite event reaches the bridge. This function
     * will check if the invite is from an upgraded room, and will
     * join the room if so.
     * @param ev A Matrix m.room.member event of membership=invite
     *           directed to the bridge bot
     * @return True if the invite is from an upgraded room and shouldn't
     * be processed.
     */
    onInvite(ev: {
        room_id: string;
    }): Promise<boolean>;
    private onJoinedNewRoom;
    private migrateStoreEntries;
    private migrateEntry;
}
