import {
  FunctionQueue,
  QueueableFunction,
} from './';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TheFnPayload {
  greeting: string;
}

const durations: number[] = [];

const startTime = Date.now();

const mockFn = (...args: any[]) => {
  if ((/^(Hello|Hi|Hey)/).test(args[0])) {
    durations.push(Date.now() - startTime);
  }

  console.log(...args);
};

const theFn: QueueableFunction<TheFnPayload, string> = async ({greeting}) => {
  const result = `${greeting.replace('e', 'e')} Async`;

  mockFn(result);

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

    let lastId;

    setTimeout(() => lastId = fnQ.queuePayload({greeting: 'Hey'}), 150);

    fnQ.queuePayload({greeting: 0 as any as string});

    await fnQ.processQueue()

    const results = fnQ.results;

    console.log(results);
    console.log(durations);

    expect(durations[0]).toBeUndefined();

    await sleep(700);

    console.log(results);
    console.log(durations);

    expect(durations[0]).toBeGreaterThanOrEqual(100);
    expect(durations[1]).toBeGreaterThanOrEqual(200);
    expect(durations[2]).toBeGreaterThanOrEqual(300);

    expect(results[0].error).toBeUndefined();
    expect(results[2].error).not.toBeUndefined();
    expect(results[2].duration).toBeGreaterThanOrEqual(200); // 1 retrie with 100ms wait time
  });


  it('can get results for a specific payload', async () => {
    const fnQ = new FunctionQueue(theFn);
  
    const firstId = fnQ.queuePayload({greeting: 'Howdy'});

    fnQ.processQueue();

    const secondId = fnQ.queuePayload({greeting: 'Hola'});

    fnQ.processQueue();

    console.log(fnQ.results);

    // this is meant to be out of order in order to 
    // test the reliability of getResult function
    const secondResult = await fnQ.getResult(secondId);
    expect(fnQ.results.length).toBe(1);
    const firstResult = await fnQ.getResult(firstId);
    expect(fnQ.results.length).toBe(0);

    console.log(fnQ.results);

    expect(firstResult.error).toBeUndefined();
    expect(secondResult.error).toBeUndefined();

    expect(firstResult.result).toBe('Howdy Async');
    expect(secondResult.result).toBe('Hola Async');

    fnQ.queuePayload({greeting: 'Greetings'});
    const lastId = fnQ.queuePayload({greeting: 'Last'});
  
    await fnQ.processQueue();

    expect(fnQ.results.length).toBe(0);

    await fnQ.getResult(lastId);

    expect(fnQ.results.length).toBe(1);
    expect(fnQ.results[0].result).toBe('Greetings Async');

    console.log(fnQ.results);
  });

  it('can safely timeout', async () => {
    const fnQ = new FunctionQueue(
      async ({greeting}) => {
        await sleep(100);
        return theFn(greeting);
      },
      {
        waitTimeBetweenRuns: 100,
        getResultTimeout: 10,
      }
    );

    const lastId = fnQ.queuePayload({greeting: 'Heeellooo'});

    fnQ.processQueue();

    const result = await fnQ.getResult(lastId);

    console.log(result);

    expect((/timeout of 10ms/).test(result.error.message)).toBe(true);
  });
});
