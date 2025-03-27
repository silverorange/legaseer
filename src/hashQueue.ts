type Queue = Record<string, (() => Promise<unknown>) | undefined>;

const hashQueue: Queue = {};
const hashRunning: Queue = {};

/**
 * @param {string} key
 */
async function runQueued(key: string) {
  if (hashQueue[key] && !hashRunning[key]) {
    hashRunning[key] = hashQueue[key];
    hashQueue[key] = undefined;
    try {
      await hashRunning[key]();
    } catch (e) {
      console.error(e);
    }
    hashRunning[key] = undefined;
    runQueued(key);
  }
}

export function queue<T>(key: string, promise: () => Promise<T>) {
  if (!hashQueue[key]) {
    hashQueue[key] = promise;
  }
  runQueued(key);
}
