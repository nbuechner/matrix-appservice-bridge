import { ILogger } from "@vector-im/matrix-bot-sdk";
import winston from "winston";
/**
 * Acceptable values for a log line entry.
 */
type LogEntryPart = string | Error | any | {
    error?: string;
};
interface LogEntry extends winston.Logform.TransformableInfo {
    data: LogEntryPart[];
    requestId: string;
    module: string;
}
export interface CustomLogger {
    verbose: (message: string, ...metadata: any[]) => void;
    debug: (message: string, ...metadata: any[]) => void;
    info: (message: string, ...metadata: any[]) => void;
    warn: (message: string, ...metadata: any[]) => void;
    error: (message: string, ...metadata: any[]) => void;
}
export type LogLevel = "debug" | "info" | "warn" | "error" | "trace";
export interface LoggingOpts {
    /**
     * The log level used by the console output.
     */
    console?: "debug" | "info" | "warn" | "error" | "trace" | "off";
    /**
     * Should the logs be outputted in JSON format, for consumption by a collector.
     */
    json?: boolean;
    /**
     * Should the logs color-code the level strings in the output.
     */
    colorize?: boolean;
    /**
     * Timestamp format used in the log output.
     * @default "HH:mm:ss:SSS"
     */
    timestampFormat?: string;
}
export interface LoggingOptsFile extends LoggingOpts {
    /**
     * An object mapping a file name to a logging level. The file will contain
     * all logs for that level inclusive up to the highest level. (`info` will contain `warn`, `error` etc)
     * Use `%DATE%` to set the date of the file within the string.
     * Use the `fileDatePattern` to set the date format.
     * @example {"info-%DATE%.log": "info"}
     */
    files: {
        [filename: string]: LogLevel;
    };
    /**
     * The number of files to keep before the last file is rotated.
     * If not set, no files are deleted.
     */
    maxFiles?: number;
    /**
     * The moment.js compatible date string to use when naming files.
     */
    fileDatePattern?: string;
}
export interface CustomLoggingOpts {
    /**
     * An object which implements the required functions for log output.
     */
    logger: CustomLogger;
}
export declare class GlobalLogger {
    private isConfigured;
    get configured(): boolean;
    private winstonLog?;
    get winston(): winston.Logger | undefined;
    configureLogging(cfg: LoggingOpts | LoggingOptsFile, debugStream?: NodeJS.WritableStream): void;
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
    get botSdkLogger(): ILogger;
}
interface LoggerMetadata {
    requestId?: string;
}
export declare class Logger {
    private readonly module;
    private readonly additionalMeta;
    private readonly logger;
    static readonly root: GlobalLogger;
    static formatLogEntryPartArray(...data: LogEntryPart[]): string;
    static messageFormatter(info: LogEntry): string;
    /**
     * Configure the root logger instance.
     * @param cfg The configuration parameters
     */
    static configure(cfg: LoggingOpts | LoggingOptsFile): void;
    static get botSdkLogger(): ILogger;
    constructor(module: string, additionalMeta?: LoggerMetadata, logger?: GlobalLogger);
    private get logMeta();
    /**
     * Logs to the DEBUG channel
     * @param msg The message or data to log.
     * @param additionalData Additional context.
     */
    debug(msg: LogEntryPart, ...additionalData: LogEntryPart[]): void;
    /**
     * Logs to the ERROR channel
     * @param msg The message or data to log.
     * @param additionalData Additional context.
     */
    error(msg: LogEntryPart, ...additionalData: LogEntryPart[]): void;
    /**
     * Logs to the INFO channel
     * @param msg The message or data to log.
     * @param additionalData Additional context.
     */
    info(msg: LogEntryPart, ...additionalData: LogEntryPart[]): void;
    /**
     * Logs to the WARN channel
     * @param msg The message or data to log.
     * @param additionalData Additional context.
     */
    warn(msg: LogEntryPart, ...additionalData: LogEntryPart[]): void;
}
export {};
