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
exports.ConfigValidator = void 0;
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
const fs = __importStar(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const is_my_json_valid_1 = __importDefault(require("is-my-json-valid"));
const extend_1 = __importDefault(require("extend"));
class ConfigValidator {
    schema;
    /**
     * Construct a validator of YAML files.
     * @param schema The JSON schema file object.
     */
    constructor(schema) {
        this.schema = schema;
    }
    /**
     * Validate the input config.
     * @param inputConfig The input config file path (string) or
     * parsed config (Object).
     * @param defaultConfig The default config options.
     * @return The input config with defaults applied.
     * @throws On validation errors
     */
    validate(inputConfig, defaultConfig = {}) {
        if (typeof inputConfig === "string") {
            inputConfig = ConfigValidator.loadFromFile(inputConfig);
        }
        const js = (0, is_my_json_valid_1.default)(this.schema, {
            verbose: true,
        });
        const res = js(inputConfig, this.schema);
        if (!res) {
            js.errors.forEach(error => {
                console.error(JSON.stringify(error));
                console.error(`The field ${error.field} is ${error.value}` +
                    ` which ${error.message}`);
            });
            const e = new Error("Failed to validate file");
            e._validationErrors = js.errors;
            throw e;
        }
        // mux in the default config
        return (0, extend_1.default)(true, {}, defaultConfig, inputConfig);
    }
    static loadFromFile(filename) {
        const result = js_yaml_1.default.load(fs.readFileSync(filename, 'utf8'));
        if (typeof (result) !== "object") {
            throw Error('Was expecting yaml as an object');
        }
        return result;
    }
    static fromSchemaFile(filename) {
        return new ConfigValidator(ConfigValidator.loadFromFile(filename));
    }
}
exports.ConfigValidator = ConfigValidator;
//# sourceMappingURL=config-validator.js.map