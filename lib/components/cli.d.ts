import { AppServiceRegistration } from "matrix-appservice";
export interface CliOpts<ConfigType extends Record<string, unknown>> {
    /**
     * This function called when you should run the bridge.
     */
    run: (port: number | null, config: ConfigType | null, registration: AppServiceRegistration | null) => void;
    /**
     * This function is when the config is hot-reloaded. If not defined, hot-reloading is disabled.
     *
     * You can hot-reload the bridge by sending a SIGHUP signal to the bridge.
     */
    onConfigChanged?: (config: ConfigType) => void;
    /**
     * The function called when you should generate a registration.
     * Must be defined unless `enableRegistration` is `false`.
     */
    generateRegistration?: (reg: AppServiceRegistration, cb: (finalReg: AppServiceRegistration) => void) => void;
    /**
     * Bridge-specific config info. If not defined, --config option will not be present in the CLI
     */
    bridgeConfig?: {
        /**
         * If true, the config will be required when generating a registration file.
         */
        affectsRegistration?: boolean;
        /**
         * Path to a schema YAML file (string) or the parsed schema file (object).
         */
        schema: string | Record<string, unknown>;
        /**
         * The default options for the config file.
         */
        defaults: Record<string, unknown>;
    };
    /**
     * The path to write the registration file to. Users can overwrite this with -f.
     * @default "registration.yaml"
     */
    registrationPath?: string;
    /**
     * Enable '--generate-registration' to allow users to generate a registration file.
     * @default true
     */
    enableRegistration?: boolean;
    /**
     * Enable '--localpart [-l]' to allow users to configure the bot localpart.
     * @default true
     */
    enableLocalpart?: boolean;
    /**
     * Don't ask user for appservice url when generating registration.
     * @default false
     */
    noUrl?: boolean;
}
interface CliArgs {
    "generate-registration"?: boolean;
    config?: string;
    url?: string;
    localpart?: string;
    port?: number;
    file?: string;
    help?: boolean;
}
export declare class Cli<ConfigType extends Record<string, unknown>> {
    static DEFAULT_WATCH_INTERVAL: number;
    static DEFAULT_FILENAME: string;
    private bridgeConfig;
    private args;
    private opts;
    /**
     * @constructor
     * @param opts CLI options
     */
    constructor(opts: CliOpts<ConfigType>);
    /**
     * Get the parsed arguments. Only set after run is called and arguments parsed.
     * @return The parsed arguments
     */
    getArgs(): CliArgs | null;
    /**
     * Get the loaded and parsed bridge config. Only set after run() has been called.
     * @return The config
     */
    getConfig(): ConfigType | null;
    /**
     * Get the path to the registration file. This may be different to the one supplied
     * in the constructor if the user passed a -f flag.
     * @return The path to the registration file.
     */
    getRegistrationFilePath(): string;
    /**
     * Run the app from the command line. Will parse sys args.
     */
    run(args?: CliArgs): void;
    private assignConfigFile;
    private loadConfig;
    private generateRegistration;
    private startWithConfig;
    private loadYaml;
    private printHelp;
}
export {};
