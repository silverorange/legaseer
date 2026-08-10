type Queue = Record<string, (() => Promise<unknown>) | undefined>;

const hashQueue: Queue = {};
const hashRunning: Queue = {};

async function runQueued(key: string) {
  if (hashRunning[key]) {
    return;
  }

  while (hashQueue[key]) {
    hashRunning[key] = hashQueue[key];
    hashQueue[key] = undefined;
    try {
      await hashRunning[key]();
    } catch (e) {
      console.error(e);
    }
    hashRunning[key] = undefined;
  }
}

export function queue<T>(key: string, promise: () => Promise<T>) {
  if (!hashQueue[key]) {
    hashQueue[key] = promise;
  }

  // intentionally do not await, we fire and forget
  void runQueued(key);
}
