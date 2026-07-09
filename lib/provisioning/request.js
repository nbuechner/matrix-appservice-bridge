"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisioningRequest = void 0;
const crypto_1 = __importDefault(require("crypto"));
const __1 = require("..");
class ProvisioningRequest {
    expressReq;
    userId;
    requestSource;
    widgetToken;
    fnName;
    log;
    id;
    constructor(expressReq, userId, requestSource, widgetToken, fnName) {
        this.expressReq = expressReq;
        this.userId = userId;
        this.requestSource = requestSource;
        this.widgetToken = widgetToken;
        this.fnName = fnName;
        this.id = crypto_1.default.randomBytes(4).toString('hex');
        this.fnName = fnName || expressReq.path;
        this.log = new __1.Logger('ProvisionRequest', { requestId: [this.id, fnName].filter(n => !!n).join(" ") });
        this.log.debug(`Request ${userId} (${requestSource}) ${this.fnName}`);
    }
    getId() {
        return this.id;
    }
    get body() {
        return this.expressReq.body;
    }
    get params() {
        return this.expressReq.params;
    }
    get query() {
        return this.expressReq.query;
    }
}
exports.ProvisioningRequest = ProvisioningRequest;
//# sourceMappingURL=request.js.map