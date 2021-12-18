var Package = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __export = (target, all) => {
    __markAsModule(target);
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    FunctionQueue: () => FunctionQueue,
    FunctionSyncQueue: () => FunctionSyncQueue
  });

  // package.json
  var version = "1.0.0";

  // src/index.ts
  var defaultOptions = {
    waitTimeBetweenRuns: 100,
    maxRetries: 1
  };
  var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  var syncSleep = (ms) => {
    const end = Date.now() + ms;
    while (Date.now() < end)
      continue;
  };
  var FunctionQueue = class {
    constructor(fn, options) {
      this._queue = [];
      this._tryFn = async (payload, retries = 0) => {
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
      };
      this._fn = fn;
      this._options = __spreadValues(__spreadValues({}, defaultOptions), options || {});
    }
    queuePayload(payload) {
      this._queue.push(payload);
    }
    async processQueue() {
      const results = [];
      let startTime;
      let endTime;
      let payload;
      while (payload = this._queue.shift()) {
        startTime = Date.now();
        try {
          const result = await this._tryFn(payload);
          endTime = Date.now();
          results.push({
            duration: endTime - startTime,
            result
          });
        } catch (error) {
          endTime = Date.now();
          results.push({
            duration: endTime - startTime,
            error
          });
        }
      }
      return results;
    }
  };
  FunctionQueue.version = version;
  var FunctionSyncQueue = class {
    constructor(fn, options) {
      this._queue = [];
      this._tryFn = (payload, retries = 0) => {
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
      };
      this._fn = fn;
      this._options = __spreadValues(__spreadValues({}, defaultOptions), options || {});
    }
    queuePayload(payload) {
      this._queue.push(payload);
    }
    processQueue() {
      const results = [];
      let startTime;
      let endTime;
      let payload;
      while (payload = this._queue.shift()) {
        startTime = Date.now();
        try {
          const result = this._tryFn(payload);
          endTime = Date.now();
          results.push({
            duration: endTime - startTime,
            result
          });
        } catch (error) {
          endTime = Date.now();
          results.push({
            duration: endTime - startTime,
            error
          });
        }
      }
      return results;
    }
  };
  FunctionSyncQueue.version = version;
  return src_exports;
})();
//# sourceMappingURL=package.js.map
'undefined'!=typeof module&&(module.exports=Package.default),'undefined'!=typeof window&&(Package=Package.default);