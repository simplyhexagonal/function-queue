declare type milliseconds = number;
export declare type QueueableFunction<O = {
    [k: string]: any;
}, R = void> = (options: O) => Promise<R>;
export declare type QueueableSyncFunction<O = {
    [k: string]: any;
}, R = void> = (options: O) => R;
export interface FunctionQueueResult<R = void> {
    duration: milliseconds;
    result?: R;
    error?: any;
}
export interface FunctionQueueOptions {
    waitTimeBetweenRuns: milliseconds;
    maxRetries: number;
}
export declare class FunctionQueue<O = {
    [k: string]: any;
}, R = void> {
    static version: string;
    private _fn;
    private _queue;
    private _options;
    constructor(fn: QueueableFunction<O, R>, options?: FunctionQueueOptions);
    queuePayload(payload: O): void;
    private _tryFn;
    processQueue(): Promise<FunctionQueueResult<R>[]>;
}
export declare class FunctionSyncQueue<O = {
    [k: string]: any;
}, R = void> {
    static version: string;
    private _fn;
    private _queue;
    private _options;
    constructor(fn: QueueableSyncFunction<O, R>, options?: FunctionQueueOptions);
    queuePayload(payload: O): void;
    private _tryFn;
    processQueue(): FunctionQueueResult<R>[];
}
export {};
