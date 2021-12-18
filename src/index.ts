// @ts-ignore
import { version } from '../package.json';

type milliseconds = number;

export type QueueableFunction<O = {[k: string]: any}, R = void> = (options: O) => Promise<R>;

export type QueueableSyncFunction<O = {[k: string]: any}, R = void> = (options: O) => R;

export interface FunctionQueueResult<R = void> {
  duration: milliseconds;
  result?: R;
  error?: any;
};

export interface FunctionQueueOptions {
  waitTimeBetweenRuns: milliseconds;
  maxRetries: number;
}

const defaultOptions: FunctionQueueOptions = {
  waitTimeBetweenRuns: 100,
  maxRetries: 1,
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const syncSleep = (ms: number) => {
    const end = Date.now() + ms;
    while (Date.now() < end) continue;
}

export class FunctionQueue<O = {[k: string]: any}, R = void> {
  static version = version;

  private _fn: QueueableFunction<O, R>;
  private _queue: O[] = [];
  private _options: FunctionQueueOptions;

  constructor(
    fn: QueueableFunction<O, R>,
    options?: FunctionQueueOptions,
  ) {
    this._fn = fn;
    this._options = {
      ...defaultOptions,
      ...(options || {}),
    };
  }

  public queuePayload(payload: O) {
    this._queue.push(payload);
  }

  private _tryFn = async (payload: O, retries: number = 0): Promise<R | any> => {
    try {
      await sleep(this._options.waitTimeBetweenRuns);

      const result = await this._fn(payload);

      return result;
    } catch (error) {
      if (retries < this._options.maxRetries) {
        return await this._tryFn(payload, retries + 1);
      }

      throw error;
    }
  }

  public async processQueue(): Promise<FunctionQueueResult<R>[]> {
    const results: FunctionQueueResult<R>[] = [];

    let startTime;
    let endTime;

    let payload: O;

    while (payload = this._queue.shift() as O) {
      startTime = Date.now();
      try {
        const result = await this._tryFn(payload);
        endTime = Date.now();

        results.push(
          {
            duration: endTime - startTime,
            result,
          }
        );
      } catch (error) {
        endTime = Date.now();
        results.push(
          {
            duration: endTime - startTime,
            error,
          }
        );
      }
    }

    return results;
  }
}

export class FunctionSyncQueue<O = {[k: string]: any}, R = void> {
  static version = version;

  private _fn: QueueableSyncFunction<O, R>;
  private _queue: O[] = [];
  private _options: FunctionQueueOptions;

  constructor(
    fn: QueueableSyncFunction<O, R>,
    options?: FunctionQueueOptions,
  ) {
    this._fn = fn;
    this._options = {
      ...defaultOptions,
      ...(options || {}),
    };
  }

  public queuePayload(payload: O) {
    this._queue.push(payload);
  }

  private _tryFn = (payload: O, retries: number = 0): R | any => {
    try {
      syncSleep(this._options.waitTimeBetweenRuns);

      const result = this._fn(payload);

      return result;
    } catch (error) {
      if (retries < this._options.maxRetries) {
        return this._tryFn(payload, retries + 1);
      }

      return error;
    }
  }

  public processQueue(): FunctionQueueResult<R>[] {
    const results: FunctionQueueResult<R>[] = [];

    let startTime;
    let endTime;

    let payload: O;

    while (payload = this._queue.shift() as O) {
      startTime = Date.now();
      try {
        const result = this._tryFn(payload);
        endTime = Date.now();
        results.push(
          {
            duration: endTime - startTime,
            result,
          }
        );
      } catch (error) {
        endTime = Date.now();
        results.push(
          {
            duration: endTime - startTime,
            error,
          }
        );
      }
    }

    return results;
  }
}
