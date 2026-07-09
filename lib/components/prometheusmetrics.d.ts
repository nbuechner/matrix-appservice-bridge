import PromClient, { Registry } from "prom-client";
import { AgeCounters } from "./agecounters";
import { Bridge } from "..";
import { Appservice as BotSdkAppservice } from "@vector-im/matrix-bot-sdk";
type CollectorFunction = () => Promise<void> | void;
export interface BridgeGaugesCounts {
    matrixRoomConfigs?: number;
    remoteRoomConfigs?: number;
    matrixGhosts?: number;
    remoteGhosts?: number;
    rmau?: number;
    matrixRoomsByAge?: AgeCounters;
    remoteRoomsByAge?: AgeCounters;
    matrixUsersByAge?: AgeCounters;
    remoteUsersByAge?: AgeCounters;
}
interface CounterOpts {
    namespace?: string;
    name: string;
    help: string;
    labels?: string[];
}
interface HistogramOpts extends CounterOpts {
    buckets?: number[];
}
interface GaugeOpts extends CounterOpts {
    refresh?: (gauge: PromClient.Gauge<string>) => void;
}
export declare class PrometheusMetrics {
    static AgeCounters: typeof AgeCounters;
    private timers;
    private counters;
    private collectors;
    private register;
    /**
     * Constructs a new Prometheus Metrics instance.
     * The metric `app_version` will be set here, so ensure that `getBridgeVersion`
     * will return the correct bridge version.
     * @param register A custom registry to provide, if not using the global default.
     */
    constructor(register?: Registry);
    /**
    * Registers some exported metrics that relate to operations of the embedded
    * matrix-bot-sdk. In particular, a metric is added that counts the number of
    * calls to client API endpoints made by the client library.
    */
    registerMatrixSdkMetrics(appservice: BotSdkAppservice): void;
    /**
     * Fetch metrics from all configured collectors
     */
    refresh(): Promise<void>;
    /**
     * Registers some exported metrics that expose counts of various kinds of
     * objects within the bridge.
     * @param {BridgeGaugesCallback} counterFunc A function that when invoked
     * returns the current counts of various items in the bridge.
     */
    registerBridgeGauges(counterFunc: () => Promise<BridgeGaugesCounts> | BridgeGaugesCounts): Promise<void>;
    /**
     * Adds a new collector function. These collector functions are run whenever
     * the /metrics page is about to be generated, allowing code to update values
     * of gauges.
     * @param {Function} func A new collector function.
     * This function is passed no arguments and is not expected to return anything.
     * It runs purely to have a side-effect on previously registered gauges.
     */
    addCollector(func: CollectorFunction): void;
    /**
     * Adds a new gauge metric.
     * @param {Object} opts Options
     * @param {string=} opts.namespace An optional toplevel namespace name for the
     * new metric. Default: <code>"bridge"</code>.
     * @param {string} opts.name The variable name for the new metric.
     * @param {string} opts.help Descriptive help text for the new metric.
     * @param {Array<string>=} opts.labels An optional list of string label names
     * @param {Function=} opts.refresh An optional function to invoke to generate a
     * new value for the gauge.
     * If a refresh function is provided, it is invoked with the gauge as its only
     * parameter. The function should call the <code>set()</code> method on this
     * gauge in order to provide a new value for it.
     * @return {Gauge} A gauge metric.
     */
    addGauge(opts: GaugeOpts): PromClient.Gauge<string>;
    /**
     * Adds a new counter metric
     * @param {Object} opts Options
     * @param {string} opts.namespace An optional toplevel namespace name for the
     * new metric. Default: <code>"bridge"</code>.
     * @param {string} opts.name The variable name for the new metric.
     * @param {string} opts.help Descriptive help text for the new metric.
     * Once created, the value of this metric can be incremented with the
     * <code>incCounter</code> method.
     * @param {Array<string>=} opts.labels An optional list of string label names
     * @return {Counter} A counter metric.
     */
    addCounter(opts: CounterOpts): PromClient.Counter<string>;
    /**
     * Increments the value of a counter metric
     * @param{string} name The name the metric was previously registered as.
     * @param{Object} labels Optional object containing additional label values.
     */
    incCounter(name: string, labels: {
        [label: string]: string;
    }): void;
    /**
     * Adds a new timer metric, represented by a prometheus Histogram.
     * @param {Object} opts Options
     * @param {string} opts.namespace An optional toplevel namespace name for the
     * new metric. Default: <code>"bridge"</code>.
     * @param {string} opts.name The variable name for the new metric.
     * @param {string} opts.help Descriptive help text for the new metric.
     * @param {string} opts.buckets The buckets that should be used for the histogram.
     * @param {Array<string>=} opts.labels An optional list of string label names
     * @return {Histogram} A histogram metric.
     * Once created, the value of this metric can be incremented with the
     * <code>startTimer</code> method.
     */
    addTimer(opts: HistogramOpts): PromClient.Histogram<string>;
    /**
     * Begins a new timer observation for a timer metric.
     * @param{string} name The name the metric was previously registered as.
     * @param{Object} labels Optional object containing additional label values.
     * @return {function} A function to be called to end the timer and report the
     * observation.
     */
    startTimer(name: string, labels: {
        [label: string]: string;
    }): () => void;
    /**
     * Registers the <code>/metrics</code> page generating function with the
     * containing Express app.
     * @param {Bridge} bridge The containing Bridge instance.
     */
    addAppServicePath(bridge: Bridge): void;
}
export {};
