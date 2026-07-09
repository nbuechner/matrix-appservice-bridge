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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = exports.AppServiceRegistration = exports.unstable = void 0;
__exportStar(require("./components/logging"), exports);
// Requests
__exportStar(require("./components/request"), exports);
__exportStar(require("./components/request-factory"), exports);
__exportStar(require("./components/encryption"), exports);
__exportStar(require("./components/encrypted-intent"), exports);
__exportStar(require("./components/intent"), exports);
__exportStar(require("./components/room-link-validator"), exports);
__exportStar(require("./components/room-upgrade-handler"), exports);
__exportStar(require("./components/app-service-bot"), exports);
__exportStar(require("./components/state-lookup"), exports);
__exportStar(require("./components/activity-tracker"), exports);
__exportStar(require("./components/media-proxy"), exports);
// Config and CLI
__exportStar(require("./components/cli"), exports);
__exportStar(require("./components/config-validator"), exports);
// Store
__exportStar(require("./components/bridge-store"), exports);
__exportStar(require("./components/user-bridge-store"), exports);
__exportStar(require("./components/user-activity-store"), exports);
__exportStar(require("./components/room-bridge-store"), exports);
__exportStar(require("./components/event-bridge-store"), exports);
__exportStar(require("./components/stores/postgres-store"), exports);
// Models
__exportStar(require("./models/rooms/matrix"), exports);
__exportStar(require("./models/rooms/remote"), exports);
__exportStar(require("./models/users/matrix"), exports);
__exportStar(require("./models/users/remote"), exports);
__exportStar(require("./models/events/event"), exports);
__exportStar(require("./components/bridge-context"), exports);
__exportStar(require("./bridge"), exports);
__exportStar(require("matrix-appservice"), exports);
__exportStar(require("./components/prometheusmetrics"), exports);
__exportStar(require("./components/agecounters"), exports);
__exportStar(require("./components/membership-cache"), exports);
__exportStar(require("./components/membership-queue"), exports);
var errors_1 = require("./errors");
Object.defineProperty(exports, "unstable", { enumerable: true, get: function () { return errors_1.unstable; } });
__exportStar(require("./components/event-types"), exports);
__exportStar(require("./components/bridge-info-state"), exports);
__exportStar(require("./components/user-activity"), exports);
__exportStar(require("./components/bridge-blocker"), exports);
__exportStar(require("./utils/package-info"), exports);
__exportStar(require("./utils/matrix-host-resolver"), exports);
__exportStar(require("./contentRepo"), exports);
var matrix_appservice_1 = require("matrix-appservice");
Object.defineProperty(exports, "AppServiceRegistration", { enumerable: true, get: function () { return matrix_appservice_1.AppServiceRegistration; } });
Object.defineProperty(exports, "AppService", { enumerable: true, get: function () { return matrix_appservice_1.AppService; } });
// Provisioning APIs
__exportStar(require("./provisioning"), exports);
//# sourceMappingURL=index.js.map