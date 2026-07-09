"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryProvisioningStore = void 0;
class MemoryProvisioningStore {
    sessions = new Map();
    getSessionForToken(token) {
        const session = this.sessions.get(token);
        if (!session) {
            return null;
        }
        return session;
    }
    createSession(session) {
        if (this.sessions.has(session.token)) {
            // Should be nearly impossible, but let's be safe
            throw Error('Token conflict!');
        }
        this.sessions.set(session.token, session);
    }
    deleteSession(token) {
        this.sessions.delete(token);
    }
    deleteAllSessions(userId) {
        [...this.sessions.values()].filter((s) => s.userId === userId).forEach(s => this.sessions.delete(s.token));
    }
}
exports.MemoryProvisioningStore = MemoryProvisioningStore;
//# sourceMappingURL=store.js.map