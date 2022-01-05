declare type milliseconds = number;
export declare type PayloadId = string;
export declare type QueueableFunction<O = {
    [k: string]: any;
}, R = void> = (options: O) => Promise<R>;
export declare type QueueableSyncFunction<O = {
    [k: string]: any;
}, R = void> = (options: O) => R;
export interface FunctionQueueResult<R = void> {
    id: PayloadId;
    duration: milliseconds;
    startTimestamp: number;
    endTimestamp: number;
    result?: R;
    error?: any;
}
export interface FunctionQueueOptions {
    waitTimeBetweenRuns: milliseconds;
    getResultTimeout: milliseconds;
    maxRetries: number;
    cleanupResultsOlderThan: milliseconds;
}
declare class FunctionQueue<O = {
    [k: string]: any;
}, R = void> {
    static version: string;
    private _fn;
    private _queue;
    private _options;
    private _processing;
    results: FunctionQueueResult<R>[];
    processQueuePromise: Promise<FunctionQueueResult<R>[]>;
    constructor(fn: QueueableFunction<O, R>, options?: Partial<FunctionQueueOptions>);
    queuePayload(payload: O): PayloadId;
    private _tryFn;
    private _processQueue;
    cleanupResults(): void;
    processQueue(): Promise<void>;
    getResult(id: string): Promise<FunctionQueueResult<R>>;
}
export default FunctionQueue;
