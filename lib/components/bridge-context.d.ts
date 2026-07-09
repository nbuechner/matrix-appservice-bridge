import { MatrixUser } from "../models/users/matrix";
import { MatrixRoom } from "../models/rooms/matrix";
import { RoomBridgeStore } from "./room-bridge-store";
import { UserBridgeStore } from "./user-bridge-store";
import { RemoteUser } from "../models/users/remote";
import { RemoteRoom } from "../models/rooms/remote";
interface BridgeContextSenders {
    matrix: MatrixUser;
    remote: RemoteUser | null;
    remotes: RemoteUser[];
}
interface BridgeContextTargets {
    matrix: MatrixUser | null;
    remote: RemoteUser | null;
    remotes: RemoteUser[];
}
interface BridgeContextRoom {
    matrix: MatrixRoom;
    remote: RemoteRoom | null;
    remotes: RemoteRoom[];
}
export declare class BridgeContext {
    private ctx;
    readonly senders: BridgeContextSenders;
    readonly targets: BridgeContextTargets;
    readonly rooms: BridgeContextRoom;
    /**
     * @param ctx Event related data
     * @param ctx.sender Matrix user ID of the sender.
     * @param ctx.target Matrix user ID of the target.
     * @param ctx.room Matrix room ID.
     */
    constructor(ctx: {
        sender: string;
        target: string | undefined;
        room: string;
    });
    /**
     * Returns this instance after its initialization.
     *
     * @param {RoomBridgeStore} roomStore
     * @param {UserBridgeStore} userStore
     * @returns {Promise<BridgeContext>}
     */
    get(roomStore: RoomBridgeStore, userStore: UserBridgeStore): Promise<BridgeContext>;
}
export {};
