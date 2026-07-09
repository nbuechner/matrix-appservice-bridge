"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.GlobalLogger = void 0;
/*
Copyright 2022 The Matrix.org Foundation C.I.C.

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
/* eslint-disable @typescript-eslint/no-explicit-any */
const matrix_bot_sdk_1 = require("@vector-im/matrix-bot-sdk");
const util_1 = __importDefault(require("util"));
const winston_1 = __importStar(require("winston"));
/**
 * Tries to filter out noise from the bot-sdk.
 * @param LogEntryPart A list of values being logged.
 * @returns True is the message is noise, or false otherwise.
 */
function isMessageNoise(logEntryParts) {
    return logEntryParts.some(part => {
        if (typeof part !== "object") {
            return false;
        }
        const possibleError = part;
        const error = possibleError?.error || possibleError?.body?.error;
        const errcode = possibleError?.errcode || possibleError?.body?.errcode;
        if (errcode === "M_NOT_FOUND" && error === "Room account data not found") {
            return true;
        }
        if (errcode === "M_NOT_FOUND" && error === "Event not found.") {
            return true;
        }
        if (errcode === "M_USER_IN_USE") {
            return true;
        }
        return false;
    });
}
class GlobalLogger {
    isConfigured = false;
    get configured() {
        return this.isConfigured;
    }
    winstonLog;
    get winston() {
        return this.winstonLog;
    }
    configureLogging(cfg, debugStream) {
        this.winstonLog?.close();
        const formatters = [
            winston_1.default.format.timestamp({
                format: cfg.timestampFormat || "HH:mm:ss:SSS",
            }),
            ((0, winston_1.format)((info) => {
                info.level = info.level.toUpperCase();
                return info;
            }))(),
        ];
        if (!cfg.json && cfg.colorize) {
            formatters.push(winston_1.default.format.colorize({
                level: true,
            }));
        }
        if (cfg.json) {
            const formatter = (0, winston_1.format)((info) => {
                const logEntry = info;
                const hsData = [...logEntry.data];
                const firstArg = hsData.shift() ?? 'undefined';
                const result = {
                    level: logEntry.level,
                    module: logEntry.module,
                    timestamp: logEntry.timestamp,
                    requestId: logEntry.requestId,
                    // Find the first instance of an error, subsequent errors are treated as args.
                    error: hsData.find(d => d instanceof Error)?.message,
                    message: "", // Always filled out
                    args: hsData.length ? hsData : undefined,
                };
                if (typeof firstArg === "string") {
                    result.message = firstArg;
                }
                else if (firstArg instanceof Error) {
                    result.message = firstArg.message;
                }
                else {
                    result.message = util_1.default.inspect(firstArg);
                }
                return result;
            });
            formatters.push(formatter(), winston_1.default.format.json());
        }
        else {
            formatters.push(winston_1.default.format.printf(i => Logger.messageFormatter(i)));
        }
        const formatter = winston_1.default.format.combine(...formatters);
        const transports = [];
        if (debugStream) {
            transports.push(new winston_1.default.transports.Stream({
                stream: debugStream,
                format: formatter,
                level: 'debug',
            }));
        }
        if (cfg.console) {
            transports.push(new winston_1.default.transports.Console({
                format: formatter,
                level: cfg.console,
            }));
        }
        const files = 'files' in cfg && new Map(Object.entries(cfg.files));
        if (files) {
            // `winston-daily-rotate-file` has side-effects, so only load if in use.
            // unless they want to use logging
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require("winston-daily-rotate-file");
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { DailyRotateFile } = require("winston/lib/winston/transports");
            for (const [filename, level] of files) {
                transports.push(new DailyRotateFile({
                    filename,
                    datePattern: cfg.fileDatePattern,
                    level,
                    maxFiles: cfg.maxFiles,
                }));
            }
        }
        this.winstonLog = winston_1.default.createLogger({
            transports: transports,
        });
        matrix_bot_sdk_1.LogService.setLogger(this.botSdkLogger);
        // We filter the logging out in winston.
        matrix_bot_sdk_1.LogService.setLevel(matrix_bot_sdk_1.LogLevel.DEBUG);
        matrix_bot_sdk_1.LogService.debug("LogWrapper", "Reconfigured logging");
        this.isConfigured = true;
    }
    /**
     * Logging implementation which can be provided to a bot-sdk LogService
     * instance to pipe logs through this component. **Note**: This is done automatically
     * for the `matrix-appservice-bridge`'s instance of the bot-sdk, but if you
     * use the bot-sdk directly in your bridge you should use the example code below
     * @example
     * ```
     * import { LogService } from "matrix-bot-sdk";
     * Logger.configure({...})
     * LogService.setLogger(Logger.logServiceLogger);
     * ```
     */
    get botSdkLogger() {
        const log = this.winstonLog;
        if (!log) {
            throw Error('Logging is not configured yet');
        }
        function formatBotSdkMessage(module, ...messageOrObject) {
            return {
                module,
                data: [Logger.formatLogEntryPartArray(messageOrObject)]
            };
        }
        return {
            info: (module, ...messageOrObject) => {
                // These are noisy, redirect to debug.
                if (module.startsWith("MatrixLiteClient") || module.startsWith("MatrixHttpClient")) {
                    log.log("debug", formatBotSdkMessage(module, ...messageOrObject));
                    return;
                }
                log.log("info", formatBotSdkMessage(module, ...messageOrObject));
            },
            warn: (module, ...messageOrObject) => {
                if (isMessageNoise(messageOrObject)) {
                    log.log("debug", formatBotSdkMessage(module, ...messageOrObject));
                    return;
                }
                log.log("warn", formatBotSdkMessage(module, ...messageOrObject));
            },
            error: (module, ...messageOrObject) => {
                if (isMessageNoise(messageOrObject)) {
                    log.log("debug", formatBotSdkMessage(module, ...messageOrObject));
                    return;
                }
                log.log("error", formatBotSdkMessage(module, ...messageOrObject));
            },
            debug: (module, ...messageOrObject) => {
                log.log("debug", formatBotSdkMessage(module, ...messageOrObject));
            },
            trace: (module, ...messageOrObject) => {
                log.log("verbose", formatBotSdkMessage(module, ...messageOrObject));
            },
        };
    }
}
exports.GlobalLogger = GlobalLogger;
class Logger {
    module;
    additionalMeta;
    logger;
    static root = new GlobalLogger();
    static formatLogEntryPartArray(...data) {
        data = data.flat();
        return data.map(obj => {
            if (typeof obj === "string") {
                return obj;
            }
            return util_1.default.inspect(obj);
        }).join(" ");
    }
    static messageFormatter(info) {
        const logPrefix = [
            info.level,
            info.timestamp,
            `[${info.module}]`,
            info.requestId,
        ].join(' ');
        return logPrefix + this.formatLogEntryPartArray(info.data ?? []);
    }
    /**
     * Configure the root logger instance.
     * @param cfg The configuration parameters
     */
    static configure(cfg) {
        this.root.configureLogging(cfg);
    }
    static get botSdkLogger() { return this.root.botSdkLogger; }
    constructor(module, additionalMeta = {}, logger = Logger.root) {
        this.module = module;
        this.additionalMeta = additionalMeta;
        this.logger = logger;
    }
    get logMeta() {
        return {
            module: this.module,
            requestId: this.additionalMeta.requestId,
        };
    }
    /**
     * Logs to the DEBUG channel
     * @param msg The message or data to log.
     * @param additionalData Additional context.
     */
    debug(msg, ...additionalData) {
        this.logger.winston?.log("debug", { ...this.logMeta, data: [msg, ...additionalData] });
    }
    /**
     * Logs to the ERROR channel
     * @param msg The message or data to log.
     * @param additionalData Additional context.
     */
    error(msg, ...additionalData) {
        this.logger.winston?.log("error", { ...this.logMeta, data: [msg, ...additionalData] });
    }
    /**
     * Logs to the INFO channel
     * @param msg The message or data to log.
     * @param additionalData Additional context.
     */
    info(msg, ...additionalData) {
        this.logger.winston?.log("info", { ...this.logMeta, data: [msg, ...additionalData] });
    }
    /**
     * Logs to the WARN channel
     * @param msg The message or data to log.
     * @param additionalData Additional context.
     */
    warn(msg, ...additionalData) {
        this.logger.winston?.log("warn", { ...this.logMeta, data: [msg, ...additionalData] });
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logging.js.map