import ShortUniqueId from 'short-unique-id';

// @ts-ignore
import { version } from '../package.json';

type milliseconds = number;

export type PayloadId = string;

export type QueueableFunction<O = {[k: string]: any}, R = void> = (options: O) => Promise<R>;

export type QueueableSyncFunction<O = {[k: string]: any}, R = void> = (options: O) => R;

export interface FunctionQueueResult<R = void> {
  id: PayloadId;
  duration: milliseconds;
  startTimestamp: number;
  endTimestamp: number;
  result?: R;
  error?: any;
};

export interface FunctionQueueOptions {
  waitTimeBetweenRuns: milliseconds;
  getResultTimeout: milliseconds;
  maxRetries: number;
  cleanupResultsOlderThan: milliseconds;
}

interface FunctionQueueEntry<O = {[k: string]: any}, R = void> {
  id: PayloadId;
  payload: O;
  result?: FunctionQueueResult<R>;
}

const uid = new ShortUniqueId({length: 8});

const defaultOptions: FunctionQueueOptions = {
  waitTimeBetweenRuns: 100,
  getResultTimeout: 60000,
  maxRetries: 1,
  cleanupResultsOlderThan: 60000,
};

const sleep = (ms: milliseconds) => new Promise(resolve => setTimeout(resolve, ms));

class FunctionQueue<O = {[k: string]: any}, R = void> {
  static version = version;

  private _fn: QueueableFunction<O, R>;
  private _queue: FunctionQueueEntry<O, R>[] = [];
  private _options: FunctionQueueOptions;
  private _processing: Boolean = false;

  public results: FunctionQueueResult<R>[] = [];
  public processQueuePromise: Promise<FunctionQueueResult<R>[]> = Promise.resolve([]);

  constructor(
    fn: QueueableFunction<O, R>,
    options?: Partial<FunctionQueueOptions>,
  ) {
    this._fn = fn;
    this._options = {
      ...defaultOptions,
      ...(options || {}),
    };
  }

  public queuePayload(payload: O): PayloadId {
    const id: PayloadId = uid();

    this._queue.push({payload, id});

    return id;
  }

  private _tryFn = async (id: string, payload: O, startTimestamp: number): Promise<FunctionQueueResult<R>> => {
    let retries = 0;

    let finalResult: FunctionQueueResult<R> | undefined;

    while ((!finalResult || (finalResult as any).error) && retries <= this._options.maxRetries) {
      retries++;

      try {
        await sleep(this._options.waitTimeBetweenRuns);

        const fnResult = await this._fn(payload);
        const endTimestamp = Date.now();
        const duration = endTimestamp - startTimestamp;

        finalResult = {
          id,
          duration,
          startTimestamp,
          endTimestamp,
          result: fnResult,
        };
      } catch (error) {
        const endTimestamp = Date.now();
        const duration = endTimestamp - startTimestamp;

        finalResult = {
          id,
          duration,
          startTimestamp,
          endTimestamp,
          error,
        };
      }
    }

    return finalResult as FunctionQueueResult<R>;
  }

  private async _processQueue(): Promise<void> {
    this._processing = true;

    let entry: FunctionQueueEntry<O, R>;

    const startTimestamp = Date.now();

    while (entry = this._queue.shift() as FunctionQueueEntry<O, R>) {
      const { payload, id } = entry;

      try {
        const result = await this._tryFn(id, payload, startTimestamp);

        this.results.push(
          {
            ...result,
          }
        );
      } catch (error) {
        const endTimestamp = Date.now();

        this.results.push(
          {
            id,
            startTimestamp,
            duration: endTimestamp - startTimestamp,
            endTimestamp,
            error,
          }
        );
      }
    }

    this._processing = false;
  }

  public cleanupResults(): void {
    this.results = this.results.filter(
      (r) => {
        const age = (Date.now() - r.endTimestamp);

        return age < this._options.cleanupResultsOlderThan;
      }
    );
  }

  public async processQueue(): Promise<void> {
    if (this._processing) {
      return;
    }

    this.cleanupResults();

    this.processQueuePromise = this._processQueue().then(() => this.results);
  }

  public async getResult(id: string): Promise<FunctionQueueResult<R>> {
    this.cleanupResults();

    let result = this.results.find((r) => r.id === id);

    const startTimestamp = Date.now();

    while (!result && (Date.now() - startTimestamp) < this._options.getResultTimeout) {
      await sleep(this._options.waitTimeBetweenRuns);
      result = this.results.find((r) => r.id === id);
    }

    if (!result) {
      const endTimestamp = Date.now();

      return {
        id,
        startTimestamp,
        duration: endTimestamp - startTimestamp,
        endTimestamp,
        error: new Error(
          `Result for id ${id} not found (timeout of ${this._options.getResultTimeout}ms exceeded)`
        ),
      };
    }

    this.results = this.results.filter((r) => r.id !== id);

    return result;
  }
}

export default FunctionQueue;
