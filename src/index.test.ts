import {
  FunctionQueue,
  FunctionSyncQueue,
  QueueableFunction,
  QueueableSyncFunction,
} from './';

interface TheFnPayload {
  greeting: string;
}

const theFn: QueueableFunction<TheFnPayload, string> = async ({greeting}) => {
  const result = `${greeting.replace('e', 'e')} Async`;

  console.log(result);

  return result;
};

const theSyncFn: QueueableSyncFunction<TheFnPayload, string> = ({greeting}) => {
  const result = `${greeting} Sync`;

  console.log(result);

  return result;
};

const greetingPayloads:TheFnPayload [] = [
  {greeting: 'Hello'},
  {greeting: 'Hi'},
];

describe('Function Queue', () => {
  it('can generate and process a queue for async functions', async () => {
    const fnQ = new FunctionQueue(theFn);

    greetingPayloads.forEach(payload => fnQ.queuePayload(payload));

    const durations: number[] = [];
    const startTime = Date.now();

    const {log} = console;
    console.log = (...args) => {
      if ((/^(Hello|Hi|Hey)/).test(args[0])) {
        durations.push(Date.now() - startTime);
      }
      log(...args);
    };

    setTimeout(() => fnQ.queuePayload({greeting: 'Hey'}), 150);
    fnQ.queuePayload({greeting: 0 as any as string});

    const results = await fnQ.processQueue();

    console.log(results);
    console.log(durations);

    expect(durations[0]).toBeGreaterThanOrEqual(100);
    expect(durations[1]).toBeGreaterThanOrEqual(200);
    expect(durations[2]).toBeGreaterThanOrEqual(300);

    expect(results[0].error).toBeUndefined();
    expect(results[2].error).not.toBeUndefined();

    console.log = log;
  });

  it('can generate and process a queue for synchronous functions', () => {
    const fnQ = new FunctionSyncQueue(theSyncFn);

    greetingPayloads.forEach(payload => fnQ.queuePayload(payload));

    const durations: number[] = [];
    const startTime = Date.now();

    const {log} = console;
    console.log = (...args) => {
      if ((/^(Hello|Hi|Hey)/).test(args[0])) {
        durations.push(Date.now() - startTime);
      }
      log(...args);
    };

    const results = fnQ.processQueue();

    console.log(results);
    console.log(durations);

    expect(durations[0]).toBeGreaterThanOrEqual(100);
    expect(durations[1]).toBeGreaterThanOrEqual(200);

    console.log = log;
  });
});
