import { ClientEncryptionSession } from "./encryption";
import BotSdk from "@vector-im/matrix-bot-sdk";
import { FileUploadOpts, Intent, IntentOpts } from "./intent";
import { WeakStateEvent } from "./event-types";
export interface EncryptedIntentOpts {
    sessionPromise: Promise<ClientEncryptionSession | null>;
    sessionCreatedCallback: (session: ClientEncryptionSession) => Promise<void>;
    ensureClientSyncingCallback: () => Promise<void>;
    originalHomeserverUrl: string;
}
/**
 * Implements some special handling on top of Intent to handle encrypted rooms.
 */
export declare class EncryptedIntent extends Intent {
    private encryptionOpts;
    private readonly encryptedRooms;
    private encryptionReadyPromise?;
    private encryptionHsClient;
    constructor(botSdkIntent: BotSdk.Intent, botClient: BotSdk.MatrixClient, intentOpts: IntentOpts, encryptionOpts: EncryptedIntentOpts);
    /**
     * Upload a file to the homeserver.
     * @param content The file contents
     * @param opts Additional options for the upload.
     * @returns A MXC URL pointing to the uploaded data.
     */
    uploadContent(content: Buffer | string, opts?: FileUploadOpts): Promise<string>;
    onEvent(event: WeakStateEvent): void;
    private loginForEncryptedClient;
    ensureRegistered(forceRegister?: boolean): Promise<"registered=true" | undefined>;
    /**
     * Get an encrypted session, either by resolving the `encryption.sessionPromise`
     * promise or creating a new session by logging in to the homeserver.
     */
    private getEncryptedSession;
    /**
     * Send a message event to a room.
     *
     * This will automatically make the client join the room so they can send the
     * message if they are not already joined. It will also make sure that the client
     * has sufficient power level to do this.
     * @param roomId The room to send to.
     * @param type The event type
     * @param content The event content
     */
    sendEvent(roomId: string, type: string, content: Record<string, unknown>): Promise<{
        event_id: string;
    }>;
    /**
     * Check if a room is encrypted. If it is, return the algorithm.
     * @param roomId The room ID to be checked
     * @returns The encryption algorithm or false
     */
    isRoomEncrypted(roomId: string): Promise<boolean>;
}
