/**
 * Forcibly set the version of the bridge, for use by other components.
 * This will override `getBridgeVersion`s default behaviour of fetching the
 * version from package.json.
 * @param version A version string e.g. `v1.0.0`
 */
export declare function setBridgeVersion(version: string): void;
/**
 * Try to determine the path of the `package.json` file for the current
 * running module. Iterates through parent directories of `require.main.filename`
 * until it finds a package.json. This **may** result in false positives.
 * @returns The path to a package.json file, or undefined if one could not be found.
 */
export declare function identifyPackageFile(): string | undefined;
/**
 * Get the current version of the bridge from the package.json file.
 * By default this uses `identifyPackageFile` to determine the file.
 * @param packageJsonPath The path to the package.json of the bridge.
 * @returns Either the version number, or unknown.
 */
export declare function getBridgeVersion(packageJsonPath?: string): string;
