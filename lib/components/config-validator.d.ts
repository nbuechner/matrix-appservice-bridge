type Schema = any;
export declare class ConfigValidator {
    private schema;
    /**
     * Construct a validator of YAML files.
     * @param schema The JSON schema file object.
     */
    constructor(schema: Schema);
    /**
     * Validate the input config.
     * @param inputConfig The input config file path (string) or
     * parsed config (Object).
     * @param defaultConfig The default config options.
     * @return The input config with defaults applied.
     * @throws On validation errors
     */
    validate(inputConfig: string | Schema, defaultConfig?: Record<string, unknown>): any;
    private static loadFromFile;
    static fromSchemaFile(filename: string): ConfigValidator;
}
export {};
