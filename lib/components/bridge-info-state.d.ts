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
    constructor(bridge: Bridge, opts: Opts<BridgeMappingInfo>);
    /**
     * Check all rooms and ensure they have correct state.
     * @param allMappings All bridged room mappings
     * @param concurrency How many rooms to handle at a time, defaults to 3.
     */
    initialSync(allMappings: Record<string, BridgeMappingInfo[]>, concurrency?: number): Promise<void>;
    private syncRoom;
    createInitialState(roomId: string, bridgeMappingInfo: BridgeMappingInfo): Promise<{
        type: string;
        content: MSC2346Content;
        state_key: string;
    }>;
    createStateKey(mapping: MappingInfo): string;
    createBridgeInfoContent(mapping: MappingInfo): MSC2346Content;
}
export {};
