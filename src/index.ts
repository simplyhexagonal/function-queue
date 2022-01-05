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

  private _tryFn = async (payload: O): Promise<FunctionQueueResult<R>> => {
    let retries = 0;

    let result;

    while ((!result || (result as any).error) && retries <= this._options.maxRetries) {
      retries++;

      try {
        await sleep(this._options.waitTimeBetweenRuns);

        result = {
          duration: 0,
          result: await this._fn(payload),
        };
      } catch (error) {
        result = {
          duration: 0,
          error,
        };
      }
    }

    return result as FunctionQueueResult<R>;
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
            ...result,
            duration: endTime - startTime,
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

  private _tryFn = (payload: O): FunctionQueueResult<R> => {
    let retries = 0;

    let result;

    while ((!result || (result as any).error) && retries <= this._options.maxRetries) {
      retries++;

      try {
        syncSleep(this._options.waitTimeBetweenRuns);

        result = {
          duration: 0,
          result: this._fn(payload),
        };
      } catch (error) {
        result = {
          duration: 0,
          error,
        };
      }
    }

    return result as FunctionQueueResult<R>;
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
            ...result,
            duration: endTime - startTime,
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
