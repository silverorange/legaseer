interface Queue {
  [key: string]: () => Promise<any>;
}

const hashQueue: Queue = {};
const hashRunning: Queue = {};

/**
 * @param {string} key
 */
async function runQueued(key: string) {
  if (hashQueue[key] && !hashRunning[key]) {
    hashRunning[key] = hashQueue[key];
    delete hashQueue[key];
    try {
      await hashRunning[key]();
    } catch (e) {
      console.error(e);
    }
    delete hashRunning[key];
    runQueued(key);
  }
}

export function queue<T>(key: string, promise: () => Promise<T>) {
  if (!hashQueue[key]) {
    hashQueue[key] = promise;
  }
  runQueued(key);
}
