import { Bridge } from "../bridge";
export interface MappingInfo {
    creator?: string;
    protocol: {
        id: string;
        displayname?: string;
        avatar_url?: `mxc://${string}`;
        external_url?: string;
    };
    network?: {
        id: string;
        displayname?: string;
        avatar_url?: `mxc://${string}`;
        external_url?: string;
    };
    channel: {
        id: string;
        displayname?: string;
        avatar_url?: `mxc://${string}`;
        external_url?: string;
    };
}
export interface MSC2346Content extends MappingInfo {
    bridgebot: string;
}
/**
 * Content shape for the finalized `m.bridge` event type, as specced after MSC2346 merged.
 * Unlike the legacy `uk.half-shot.bridge` content, this only carries `bridgebot` and `protocol`.
 */
export interface BridgeContent {
    bridgebot?: string;
    protocol?: {
        id?: string;
        displayname?: string;
        avatar_url?: `mxc://${string}`;
    };
}
interface Opts<BridgeMappingInfo> {
    /**
     * The name of the bridge implementation, ideally in Java package naming format:
     * @example org.matrix.matrix-appservice-irc
     */
    bridgeName: string;
    /**
     * This should return some standard information about a given
     * mapping.
     */
    getMapping: (roomId: string, info: BridgeMappingInfo) => Promise<MappingInfo>;
}
/**
 * This class ensures that rooms contain a valid bridge info
 * event ([MSC2346](https://github.com/matrix-org/matrix-doc/pull/2346))
 * which displays the connected protocol, network and room.
 */
export declare class BridgeInfoStateSyncer<BridgeMappingInfo> {
    private bridge;
    private opts;
    static readonly EventType = "uk.half-shot.bridge";
    /**
     * The finalized event type from the Matrix spec (post-MSC2346). Clients that only know about
     * this identifier (and not the legacy `uk.half-shot.bridge` one used above) rely on this being
     * sent too in order to detect bridged rooms.
     */
    static readonly FinalEventType = "m.bridge";
    constructor(bridge: Bridge, opts: Opts<BridgeMappingInfo>);
    /**
     * Check all rooms and ensure they have correct state.
     * @param allMappings All bridged room mappings
     * @param concurrency How many rooms to handle at a time, defaults to 3.
     */
    initialSync(allMappings: Record<string, BridgeMappingInfo[]>, concurrency?: number): Promise<void>;
    private syncRoom;
    private syncFinalEvent;
    createInitialState(roomId: string, bridgeMappingInfo: BridgeMappingInfo): Promise<{
        type: string;
        content: MSC2346Content;
        state_key: string;
    }>;
    createStateKey(mapping: MappingInfo): string;
    createBridgeInfoContent(mapping: MappingInfo): MSC2346Content;
    createFinalBridgeInfoContent(mapping: MappingInfo): BridgeContent;
}
export {};
