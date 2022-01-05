# Function Queue
![Tests](https://github.com/simplyhexagonal/function-queue/workflows/tests/badge.svg)
[![Try function-queue on RunKit](https://badge.runkitcdn.com/@simplyhexagonal/function-queue.svg)](https://npm.runkit.com/@simplyhexagonal/function-queue)

Description of function-queue.

## Open source notice

This project is open to updates by its users, [I](https://github.com/jeanlescure) ensure that PRs are relevant to the community.
In other words, if you find a bug or want a new feature, please help us by becoming one of the
[contributors](#contributors-) ✌️ ! See the [contributing section](#contributing)

## Like this module? ❤

Please consider:

- [Buying me a coffee](https://www.buymeacoffee.com/jeanlescure) ☕
- Supporting Simply Hexagonal on [Open Collective](https://opencollective.com/simplyhexagonal) 🏆
- Starring this repo on [Github](https://github.com/simplyhexagonal/function-queue) 🌟

## Install

```sh
pnpm i @simplyhexagonal/function-queue

# or
yarn add @simplyhexagonal/function-queue

# or
npm install @simplyhexagonal/function-queue
```

## Usage

Queue multiple payloads and wait for all to complete:

```ts
import FunctionQueue, {
  QueueableFunction,
} from '@simplyhexagonal/function-queue';

interface MyFnPayload {
  greeting: string;
}

const myFn: QueueableFunction<MyFnPayload, string> = async ({greeting}) => {
  const fnResult = `${greeting.toUpperCase()} World!`;

  console.log(fnResult);

  return fnResult;
};

const fnQueue = new FunctionQueue(
  myFn,
  {
    waitTimeBetweenRuns: 100, //default
    getResultTimeout: 60000, //default
    maxRetries: 1, //default
    cleanupResultsOlderThan: 60000, //default
  }
);

fnQueue.queuePayload({greeting: 'Hello'});
fnQueue.queuePayload({greeting: 'Hey'});
fnQueue.queuePayload({greeting: 'Hi'});
fnQueue.queuePayload({greeting: 0 as any as string}); // This is bad and would obviously fail at runtime

fnQ.processQueue();

const results = await fnQ.processQueuePromise;

console.log(results);

// [
//   { duration: 138, result: 'HELLO World!', ... },
//   { duration: 104, result: 'HEY World!', ... }
//   { duration: 104, result: 'HI World!', ... },
//   {
//      duration: 202,
//      error: TypeError: greeting.toUpperCase is not a function
//      ...
//   }
// ]
```

Queue multiple payloads but only get the results you need:

```ts
import FunctionQueue, {
  QueueableFunction,
} from '@simplyhexagonal/function-queue';

interface MyFnPayload {
  greeting: string;
}

const myFn: QueueableFunction<MyFnPayload, string> = async ({greeting}) => {
  const fnResult = `${greeting.toUpperCase()} World!`;

  console.log(fnResult);

  return fnResult;
};

const fnQueue = new FunctionQueue(myFn);

const payloadId1 = fnQueue.queuePayload({greeting: 'Hello'});
const payloadId2 = fnQueue.queuePayload({greeting: 0 as any as string}); // This is bad and would obviously fail at runtime

fnQ.processQueue();

let result;

result = await fnQ.getResult(payloadId2);

console.log(result);

//   {
//      duration: 202,
//      error: TypeError: greeting.toUpperCase is not a function
//      ...
//   }

result = await fnQ.getResult(payloadId1);

console.log(result);

//   { duration: 138, result: 'HELLO World!', ... },
```

## A note regarding cleaning up the queue results

Results that have an `endTimestamp` older than the `cleanupResultsOlderThan` option will be cleaned
up automatically _only_ when `fnQ.processQueue()` or `fnQ.getResult(...)` are called.

If you find results getting stuck in memory for too long and would like to clean them up either
manually or periodically, you can use the `fnQ.cleanupResults()` method.

## Contributing

Yes, thank you! This plugin is community-driven, most of its features are from different authors.
Please update the docs and tests and add your name to the `package.json` file.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://jeanlescure.cr"><img src="https://avatars2.githubusercontent.com/u/3330339?v=4" width="100px;" alt=""/><br /><sub><b>Jean Lescure</b></sub></a><br /><a href="#maintenance-jeanlescure" title="Maintenance">🚧</a> <a href="https://github.com/simplyhexagonal/function-queue/commits?author=jeanlescure" title="Code">💻</a> <a href="#userTesting-jeanlescure" title="User Testing">📓</a> <a href="https://github.com/simplyhexagonal/function-queue/commits?author=jeanlescure" title="Tests">⚠️</a> <a href="#example-jeanlescure" title="Examples">💡</a> <a href="https://github.com/simplyhexagonal/function-queue/commits?author=jeanlescure" title="Documentation">📖</a></td>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->
## License

Copyright (c) 2021-Present [Function Queue Contributors](https://github.com/simplyhexagonal/function-queue/#contributors-).<br/>
Licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
