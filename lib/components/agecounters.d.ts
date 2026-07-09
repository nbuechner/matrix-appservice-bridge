import { Gauge } from "prom-client";
/**
 * A small helper object that counts into buckets the number of calls to its
 * <code>bump</code> that fall into the given age categories.
 * Counts are maintained within the object, and can be fetched to set
 * into a gauge metric object.
 *
 * This class is useful when exporting metrics that count the number of
 * hourly/daily/weekly active instances of various types of object within the
 * bridge.
 */
export declare class AgeCounters {
    private counters;
    private counterPeriods;
    /***
     * @param {String[]} counterPeriods A set of strings denoting the bucket periods
     * used by the gauge. It is in the format of '#X' where # is the integer period and
     * X is the unit of time. A unit can be one of 'h, d, w' for hours, days and weeks.
     * 7d would be 7 days. If not given, the periods are 1h, 1d and 7d.
     */
    constructor(counterPeriods?: string[]);
    /**
     * Increment the values of the internal counters depending on the given age,
     * in seconds.
     *
     * @param {Number} age The age in seconds.
     */
    bump(age: number): void;
    /**
     * Fetch the counts in the age buckets and set them as labeled observations in
     * the given gauge metric instance.
     *
     * @param {Gauge} gauge The gauge metric instance.
     * @param {Object} morelabels An object containing more labels to add to the
     * gauge when setting values.
     */
    setGauge(gauge: Gauge<string>, morelabels?: {
        [label: string]: string;
    }): void;
}
