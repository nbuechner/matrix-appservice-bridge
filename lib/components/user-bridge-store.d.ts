import type Datastore from "nedb";
import { BridgeStore } from "./bridge-store";
import { MatrixUser } from "../models/users/matrix";
import { RemoteUser } from "../models/users/remote";
export declare class UserBridgeStore extends BridgeStore {
    /**
     * Construct a store suitable for user bridging information.
     * @param db The connected NEDB database instance
     */
    constructor(db: Datastore);
    /**
     * Retrieve a list of corresponding remote users for the given matrix user ID.
     * @param userId The Matrix user ID
     * @return Resolves to a list of Remote users.
     */
    getRemoteUsersFromMatrixId(userId: string): Promise<RemoteUser[]>;
    /**
     * Retrieve a list of corresponding matrix users for the given remote ID.
     * @param remoteId The Remote ID
     * @return Resolves to a list of Matrix users.
     */
    getMatrixUsersFromRemoteId(remoteId: string): Promise<MatrixUser[]>;
    /**
     * Retrieve a MatrixUser based on their user ID localpart. If there is more than
     * one match (e.g. same localpart, different domains) then this will return an
     * arbitrary matching user.
     * @param localpart The user localpart
     * @return Resolves to a MatrixUser or null.
     */
    getByMatrixLocalpart(localpart: string): Promise<MatrixUser | null>;
    /**
     * Get a matrix user by their user ID.
     * @param userId The user_id
     * @return Resolves to the user or null if they
     * do not exist. Rejects with an error if there was a problem querying the store.
     */
    getMatrixUser(userId: string): Promise<MatrixUser | null>;
    /**
     * Store a Matrix user. If they already exist, they will be updated. Equivalence
     * is determined by their user ID.
     * @param matrixUser The matrix user
     */
    setMatrixUser(matrixUser: MatrixUser): Promise<void>;
    /**
     * Get a remote user by their remote ID.
     * @param id The remote ID
     * @return Resolves to the user or null if they
     * do not exist. Rejects with an error if there was a problem querying the store.
     */
    getRemoteUser(id: string): Promise<RemoteUser | null>;
    /**
     * Get remote users by some data about them, previously stored via the set
     * method on the Remote user.
     * @param dataQuery The keys and matching values the remote users share.
     * This should use dot notation for nested types. For example:
     * <code> { "topLevel.midLevel.leaf": 42, "otherTopLevel": "foo" } </code>
     * @return Resolves to a possibly empty list of
     * RemoteUsers. Rejects with an error if there was a problem querying the store.
     * @throws If dataQuery isn't an object.
     * @example
     * remoteUser.set({
     *   toplevel: "foo",
     *   nested: {
     *     bar: {
     *       baz: 43
     *     }
     *   }
     * });
     * store.setRemoteUser(remoteUser).then(function() {
     *   store.getByRemoteData({
     *     "toplevel": "foo",
     *     "nested.bar.baz": 43
     *   })
     * });
     */
    getByRemoteData(dataQuery: Record<string, unknown>): Promise<RemoteUser[]>;
    /**
     * Get Matrix users by some data about them, previously stored via the set
     * method on the Matrix user.
     * @param dataQuery The keys and matching values the remote users share.
     * This should use dot notation for nested types. For example:
     * <code> { "topLevel.midLevel.leaf": 42, "otherTopLevel": "foo" } </code>
     * @return Resolves to a possibly empty list of
     * MatrixUsers. Rejects with an error if there was a problem querying the store.
     * @throws If dataQuery isn't an object.
     * @example
     * matrixUser.set({
     *   toplevel: "foo",
     *   nested: {
     *     bar: {
     *       baz: 43
     *     }
     *   }
     * });
     * store.setMatrixUser(matrixUser).then(function() {
     *   store.getByMatrixData({
     *     "toplevel": "foo",
     *     "nested.bar.baz": 43
     *   })
     * });
     */
    getByMatrixData(dataQuery: Record<string, unknown>): Promise<MatrixUser[]>;
    /**
     * Store a Remote user. If they already exist, they will be updated. Equivalence
     * is determined by the Remote ID.
     * @param remoteUser The remote user
     */
    setRemoteUser(remoteUser: RemoteUser): Promise<void>;
    /**
     * Create a link between a matrix and remote user. If either user does not exist,
     * they will be inserted prior to linking. This is done to ensure foreign key
     * constraints are satisfied (so you cannot have a mapping to a user ID which
     * does not exist).
     * @param matrixUser The matrix user
     * @param remoteUser The remote user
     */
    linkUsers(matrixUser: MatrixUser, remoteUser: RemoteUser): Promise<void>;
    /**
     * Delete a link between a matrix user and a remote user.
     * @param matrixUser The matrix user
     * @param remoteUser The remote user
     * @return Resolves to the number of entries removed.
     */
    unlinkUsers(matrixUser: MatrixUser, remoteUser: RemoteUser): Promise<number>;
    /**
     * Delete a link between a matrix user ID and a remote user ID.
     * @param matrixUserId The matrix user ID
     * @param remoteUserId The remote user ID
     * @return Resolves to the number of entries removed.
     */
    unlinkUserIds(matrixUserId: string, remoteUserId: string): Promise<number>;
    /**
     * Retrieve a list of matrix user IDs linked to this remote ID.
     * @param remoteId The remote ID
     * @return A list of user IDs.
     */
    getMatrixLinks(remoteId: string): Promise<string[] | null>;
    /**
     * Retrieve a list of remote IDs linked to this matrix user ID.
     * @param matrixId The matrix user ID
     * @return A list of remote IDs.
     */
    getRemoteLinks(matrixId: string): Promise<string[] | null>;
}
