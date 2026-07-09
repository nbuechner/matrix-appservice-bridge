"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRepo = void 0;
const matrix_bot_sdk_1 = require("@vector-im/matrix-bot-sdk");
/**
 * Get the HTTP URL for an MXC URI.
 * @param {string} baseUrl The base homeserver url which has a content repo.
 * @param {string} mxc The mxc:// URI.
 * @param {Number} width The desired width of the thumbnail.
 * @param {Number} height The desired height of the thumbnail.
 * @param resizeMethod The thumbnail resize method to use, either
 * "crop" or "scale".
 * @param allowDirectLinks If true, return any non-mxc URLs
 * directly. Fetching such URLs will leak information about the user to
 * anyone they share a room with. If false, will return the emptry string
 * for such URLs.
 * @return The complete URL to the content. May be empty string if mxc is not a string.
 */
async function getHttpUriForMxc(baseUrl, mxc, width, height, resizeMethod, allowDirectLinks) {
    console.warn("Deprecated call to ContentRepo.getHttpUriForMxc, prefer to use Intent.matrixClient.mxcToHttp");
    if (typeof mxc !== "string" || !mxc) {
        return "";
    }
    if (!mxc.startsWith("mxc://")) {
        return allowDirectLinks ? mxc : "";
    }
    if (width || height || resizeMethod) {
        return new matrix_bot_sdk_1.MatrixClient(baseUrl, "").mxcToHttpThumbnail(
        // Types are possibly not defined here, but this matches the previous implementation
        mxc, width, height, resizeMethod);
    }
    return new matrix_bot_sdk_1.MatrixClient(baseUrl, "").mxcToHttp(mxc);
}
exports.ContentRepo = {
    getHttpUriForMxc: getHttpUriForMxc,
};
//# sourceMappingURL=contentRepo.js.map