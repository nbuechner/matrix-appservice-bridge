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
exports.Cli = void 0;
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml = __importStar(require("js-yaml"));
const nopt_1 = __importDefault(require("nopt"));
const matrix_appservice_1 = require("matrix-appservice");
const config_validator_1 = require("./config-validator");
const __1 = require("..");
const log = new __1.Logger("cli");
class Cli {
    static DEFAULT_WATCH_INTERVAL = 2500;
    static DEFAULT_FILENAME = "registration.yaml";
    bridgeConfig = null;
    args = null;
    opts;
    /**
     * @constructor
     * @param opts CLI options
     */
    constructor(opts) {
        if (!opts.run || typeof opts.run !== "function") {
            throw new Error("Requires 'run' function.");
        }
        if (opts.enableRegistration && !opts.generateRegistration) {
            throw new Error("Registration generation is enabled but no " +
                "'generateRegistration' function has been provided");
        }
        this.opts = {
            ...opts,
            enableRegistration: typeof opts.enableRegistration === 'boolean' ? opts.enableRegistration : true,
            enableLocalpart: Boolean(opts.enableLocalpart),
            registrationPath: opts.registrationPath || Cli.DEFAULT_FILENAME,
        };
    }
    /**
     * Get the parsed arguments. Only set after run is called and arguments parsed.
     * @return The parsed arguments
     */
    getArgs() {
        return this.args;
    }
    /**
     * Get the loaded and parsed bridge config. Only set after run() has been called.
     * @return The config
     */
    getConfig() {
        return this.bridgeConfig;
    }
    /**
     * Get the path to the registration file. This may be different to the one supplied
     * in the constructor if the user passed a -f flag.
     * @return The path to the registration file.
     */
    getRegistrationFilePath() {
        return this.opts.registrationPath;
    }
    /**
     * Run the app from the command line. Will parse sys args.
     */
    run(args) {
        this.args = args || (0, nopt_1.default)({
            "generate-registration": Boolean,
            "config": path_1.default,
            "url": String,
            "localpart": String,
            "port": Number,
            "file": path_1.default,
            "help": Boolean
        }, {
            "c": "--config",
            "u": "--url",
            "r": "--generate-registration",
            "l": "--localpart",
            "p": "--port",
            "f": "--file",
            "h": "--help"
            // We know the typings will be correct.
        });
        if (this.args.file) {
            this.opts.registrationPath = this.args.file;
        }
        if (this.opts.enableRegistration && this.args["generate-registration"]) {
            if (!this.args.url && !this.opts.noUrl) {
                this.printHelp();
                console.log("Missing --url [-u]");
                process.exit(1);
            }
            else if (this.args.url && this.opts.noUrl) {
                this.printHelp();
                console.log("--url [-u] is not valid option for this bridge.");
                process.exit(1);
            }
            if (this.args.port) {
                this.printHelp();
                console.log("--port [-p] is not valid when generating a registration file.");
                process.exit(1);
            }
            if (this.opts.bridgeConfig && this.opts.bridgeConfig.affectsRegistration) {
                if (!this.args.config) {
                    this.printHelp();
                    console.log("Missing --config [-c]");
                    process.exit(1);
                }
                this.assignConfigFile(this.args.config);
            }
            this.generateRegistration(this.args.url, this.args.localpart);
            return;
        }
        if (this.args.help || (this.opts.bridgeConfig && !this.args.config)) {
            this.printHelp();
            process.exit(0);
            return;
        }
        if (this.args.localpart) {
            this.printHelp();
            console.log("--localpart [-l] can only be provided when generating a registration.");
            process.exit(1);
            return;
        }
        this.assignConfigFile(this.args.config);
        this.startWithConfig(this.args.config, this.args.port || null);
    }
    assignConfigFile(configFilePath) {
        const configFile = (this.opts.bridgeConfig && configFilePath) ? configFilePath : undefined;
        if (!configFile) {
            return;
        }
        const config = this.loadConfig(configFile);
        this.bridgeConfig = config;
    }
    loadConfig(filename) {
        log.info("Loading config file", filename);
        const cfg = this.loadYaml(filename);
        if (!cfg || typeof cfg === "string") {
            throw Error("Config file " + filename + " isn't valid YAML.");
        }
        if (!this.opts.bridgeConfig?.schema) {
            return cfg;
        }
        let validator;
        if (typeof this.opts.bridgeConfig.schema === "string") {
            validator = config_validator_1.ConfigValidator.fromSchemaFile(this.opts.bridgeConfig.schema);
        }
        else {
            validator = new config_validator_1.ConfigValidator(this.opts.bridgeConfig.schema);
        }
        return validator.validate(cfg, this.opts.bridgeConfig.defaults);
    }
    generateRegistration(appServiceUrl, localpart) {
        let reg = new matrix_appservice_1.AppServiceRegistration(appServiceUrl || "");
        if (localpart) {
            reg.setSenderLocalpart(localpart);
        }
        if (!this.opts.generateRegistration) {
            throw Error('No generateRegistraton function provided');
        }
        this.opts.generateRegistration.bind(this)(reg, (completeReg) => {
            reg = completeReg;
            reg.outputAsYaml(this.opts.registrationPath);
            log.info("Output registration to: " + this.opts.registrationPath);
            process.exit(0);
        });
    }
    startWithConfig(configFilename, port) {
        if (this.opts.onConfigChanged && this.opts.bridgeConfig) {
            log.info("Will listen for SIGHUP");
            if (configFilename) {
                process.on("SIGHUP", () => {
                    log.info("Got SIGHUP, reloading config file");
                    try {
                        const newConfig = this.loadConfig(configFilename);
                        if (this.opts.onConfigChanged) {
                            this.opts.onConfigChanged(newConfig);
                        }
                    }
                    catch (ex) {
                        log.warn("Failed to reload config file:", ex);
                    }
                });
            }
        }
        const yamlObj = this.loadYaml(this.opts.registrationPath);
        if (typeof yamlObj !== "object") {
            throw Error('Registration file did not parse to an object');
        }
        this.opts.run(port, this.bridgeConfig, matrix_appservice_1.AppServiceRegistration.fromObject(yamlObj));
    }
    loadYaml(fpath) {
        return yaml.load(fs.readFileSync(fpath, 'utf8'));
    }
    printHelp() {
        const help = {
            "--help -h": "Display this help message",
            "--file -f": "The registration file to load or save to."
        };
        const appPart = (process.argv[0] === "node" ?
            // node file/path
            (process.argv[0] + " " + path_1.default.relative(process.cwd(), process.argv[1])) :
            // app-name
            process.argv[0]);
        const usages = [];
        if (this.opts.enableRegistration) {
            help["--generate-registration -r"] = "Create a registration YAML file " +
                "for this application service";
            if (!this.opts.noUrl) {
                help["--url -u"] = "Registration Option. Required if -r is set. The " +
                    "URL where the application service is listening for HS requests";
            }
            if (this.opts.enableLocalpart) {
                help["--localpart -l"] = "Registration Option. Valid if -r is set. " +
                    "The user_id localpart to assign to the AS.";
            }
            let regUsage = "-r [-f /path/to/save/registration.yaml] " +
                "-u 'http://localhost:6789'";
            if (this.opts.bridgeConfig && this.opts.bridgeConfig.affectsRegistration) {
                regUsage += " -c CONFIG_FILE";
            }
            if (this.opts.enableLocalpart) {
                regUsage += " [-l my-app-service]";
            }
            usages.push(regUsage);
        }
        if (this.opts.bridgeConfig) {
            help["--config -c"] = "The config file to load";
            usages.push("-c CONFIG_FILE [-f /path/to/load/registration.yaml] [-p NUMBER]");
        }
        else {
            usages.push("[-f /path/to/load/registration.yaml] [-p NUMBER]");
        }
        help["--port -p"] = "The port to listen on for HS requests";
        console.log("Usage:\n");
        console.log("Generating an application service registration file:");
        console.log("%s %s\n", appPart, usages[0]);
        console.log("Running an application service with an existing registration file:");
        console.log("%s %s", appPart, usages[1]);
        console.log("\nOptions:");
        Object.keys(help).forEach(function (k) {
            console.log("  %s", k);
            console.log("      %s", help[k]);
        });
    }
}
exports.Cli = Cli;
//# sourceMappingURL=cli.js.map