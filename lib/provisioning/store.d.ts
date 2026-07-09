export interface ProvisionSession {
    userId: string;
    token: string;
    expiresTs: number;
}
export interface ProvisioningStore {
    getSessionForToken(token: string): Promise<ProvisionSession | null> | ProvisionSession | null;
    createSession(session: ProvisionSession): Promise<void> | void;
    deleteSession(token: string): Promise<void> | void;
    deleteAllSessions(userId: string): Promise<void> | void;
}
export declare class MemoryProvisioningStore implements ProvisioningStore {
    private readonly sessions;
    getSessionForToken(token: string): ProvisionSession | null;
    createSession(session: ProvisionSession): void;
    deleteSession(token: string): void;
    deleteAllSessions(userId: string): void;
}
