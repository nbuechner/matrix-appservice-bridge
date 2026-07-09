"use strict";
/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomLinkValidatorStatus = exports.RoomLinkValidator = void 0;
const util_1 = __importDefault(require("util"));
const __1 = require("..");
const log = new __1.Logger("room-link-validator");
const VALIDATION_CACHE_LIFETIME = 30 * 60 * 1000;
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
class RoomLinkValidator {
    asBot;
    conflictCache = new Map();
    internalRules;
    // Public to allow unit tests to inspect it.
    get rules() {
        return this.internalRules;
    }
    /**
     * @param config Config for the validator.
     * @param config.ruleFile Filename for the rule file.
     * @param config.rules Rules if not using a rule file, will be
     *                               overwritten if both is set.
     * @param asBot The AS bot.
     */
    constructor(config, asBot) {
        this.asBot = asBot;
        if (!config.rules) {
            throw new Error("config.rules must be set");
        }
        this.internalRules = this.evaluateRules(config.rules);
    }
    updateRules(rules) {
        this.internalRules = this.evaluateRules(rules);
    }
    evaluateRules(rules) {
        const newRules = {
            userIds: {
                conflict: [],
                exempt: [],
            }
        };
        const vettedRules = (rules && typeof rules === "object") ? rules : {};
        const vettedUserIds = (vettedRules.userIds && typeof vettedRules.userIds === "object") ? vettedRules.userIds : {};
        if (Array.isArray(vettedUserIds.conflict)) {
            vettedUserIds.conflict.forEach((regexStr) => {
                if (typeof regexStr !== 'string' || util_1.default.types.isRegExp(regexStr)) {
                    log.warn(`All elements in userIds.conflict must be strings. Found ${typeof regexStr}.`);
                    return;
                }
                newRules.userIds.conflict.push(RegExp(regexStr));
            });
        }
        if (Array.isArray(vettedUserIds.exempt)) {
            vettedUserIds.exempt.forEach((regexStr) => {
                if (typeof regexStr !== 'string' || util_1.default.types.isRegExp(regexStr)) {
                    log.warn(`All elements in userIds.exempt must be strings. Found ${typeof regexStr}.`);
                    return;
                }
                newRules.userIds.exempt.push(RegExp(regexStr));
            });
        }
        return newRules;
    }
    async validateRoom(roomId, cache = true) {
        const status = cache ? this.checkConflictCache(roomId) : undefined;
        if (status !== undefined) {
            throw status;
        }
        // Get all users in the room.
        const joined = await this.asBot.getJoinedMembers(roomId);
        let isValid = true;
        for (const userId of Object.keys(joined)) {
            const ignoreUser = this.rules.userIds.exempt.some(rule => rule.test(userId));
            if (ignoreUser) {
                continue;
            }
            const hasConflict = this.rules.userIds.conflict.some(rule => rule.test(userId));
            if (hasConflict) {
                isValid = false;
            }
        }
        if (isValid) {
            return RoomLinkValidatorStatus.PASSED;
        }
        this.conflictCache.set(roomId, Date.now());
        throw RoomLinkValidatorStatus.ERROR_USER_CONFLICT;
    }
    checkConflictCache(roomId) {
        const cacheTime = this.conflictCache.get(roomId);
        if (!cacheTime) {
            return undefined;
        }
        if (cacheTime > (Date.now() - VALIDATION_CACHE_LIFETIME)) {
            return RoomLinkValidatorStatus.ERROR_CACHED;
        }
        this.conflictCache.delete(roomId);
        return undefined;
    }
}
exports.RoomLinkValidator = RoomLinkValidator;
var RoomLinkValidatorStatus;
(function (RoomLinkValidatorStatus) {
    RoomLinkValidatorStatus[RoomLinkValidatorStatus["PASSED"] = 0] = "PASSED";
    RoomLinkValidatorStatus[RoomLinkValidatorStatus["ERROR_USER_CONFLICT"] = 1] = "ERROR_USER_CONFLICT";
    RoomLinkValidatorStatus[RoomLinkValidatorStatus["ERROR_CACHED"] = 2] = "ERROR_CACHED";
    RoomLinkValidatorStatus[RoomLinkValidatorStatus["ERROR"] = 3] = "ERROR";
})(RoomLinkValidatorStatus || (exports.RoomLinkValidatorStatus = RoomLinkValidatorStatus = {}));
//# sourceMappingURL=room-link-validator.js.map