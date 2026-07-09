"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBridgeVersion = setBridgeVersion;
exports.identifyPackageFile = identifyPackageFile;
exports.getBridgeVersion = getBridgeVersion;
const path_1 = require("path");
const fs_1 = require("fs");
const pkginfo_1 = __importDefault(require("pkginfo"));
// This may be defined if the script is run via NPM: https://docs.npmjs.com/cli/v8/using-npm/scripts#packagejson-vars
let BridgeVersion = process.env.npm_package_version;
/**
 * Forcibly set the version of the bridge, for use by other components.
 * This will override `getBridgeVersion`s default behaviour of fetching the
 * version from package.json.
 * @param version A version string e.g. `v1.0.0`
 */
function setBridgeVersion(version) {
    BridgeVersion = version;
}
/**
 * Try to determine the path of the `package.json` file for the current
 * running module. Iterates through parent directories of `require.main.filename`
 * until it finds a package.json. This **may** result in false positives.
 * @returns The path to a package.json file, or undefined if one could not be found.
 */
function identifyPackageFile() {
    // Find the main module path first
    let mainModulePath = require.main?.filename;
    if (!mainModulePath) {
        return undefined;
    }
    do {
        mainModulePath = (0, path_1.dirname)(mainModulePath);
        try {
            const packagePath = (0, path_1.join)(mainModulePath, 'package.json');
            (0, fs_1.statSync)(packagePath);
            return packagePath;
        }
        catch {
            continue;
        }
    } while (mainModulePath !== '/');
    return undefined;
}
/**
 * Get the current version of the bridge from the package.json file.
 * By default this uses `identifyPackageFile` to determine the file.
 * @param packageJsonPath The path to the package.json of the bridge.
 * @returns Either the version number, or unknown.
 */
function getBridgeVersion(packageJsonPath) {
    if (BridgeVersion) {
        return BridgeVersion;
    }
    BridgeVersion = require.main && pkginfo_1.default.read(require.main, packageJsonPath && (0, path_1.dirname)(packageJsonPath))?.package.version || "unknown";
    // Need to be explicit here due to the type of the static BridgeVersion
    return BridgeVersion;
}
//# sourceMappingURL=package-info.js.map