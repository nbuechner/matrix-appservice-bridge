import { AppServiceBot } from "./app-service-bot";
export interface Rules {
    userIds: {
        exempt: RegExp[];
        conflict: RegExp[];
    };
}
/**
 * The RoomLinkValidator checks if a room should be linked to a remote
 * channel, given a set of rules supplied in a config.
 *
 * This ruleset can be hot-reloaded. Developers should call `Bridge.updateRoomLinkValidatorRules`
 * within the `CliOpts.onConfigChanged` callback to reload rules on
 * config reload.
 * @see CliOpts#onConfigChanged
 * @see Bridge#updateRoomLinkValidatorRules
 */
export declare class RoomLinkValidator {
    private asBot;
    private conflictCache;
    private internalRules;
    get rules(): Rules;
    /**
     * @param config Config for the validator.
     * @param config.ruleFile Filename for the rule file.
     * @param config.rules Rules if not using a rule file, will be
     *                               overwritten if both is set.
     * @param asBot The AS bot.
     */
    constructor(config: {
        rules: Rules;
    }, asBot: AppServiceBot);
    updateRules(rules: Rules): void;
    private evaluateRules;
    validateRoom(roomId: string, cache?: boolean): Promise<RoomLinkValidatorStatus>;
    private checkConflictCache;
}
export declare enum RoomLinkValidatorStatus {
    PASSED = 0,
    ERROR_USER_CONFLICT = 1,
    ERROR_CACHED = 2,
    ERROR = 3
}
