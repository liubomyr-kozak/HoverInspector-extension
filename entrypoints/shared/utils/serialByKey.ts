/**
 * Runs async tasks one after another per key: a task for a key starts only after the previous task for
 * the same key settled (resolved or rejected). Tasks for different keys run independently.
 */
export function createSerialByKey<Key>() {
  const tails = new Map<Key, Promise<unknown>>();

  return function run<T>(key: Key, task: () => Promise<T>): Promise<T> {
    const previous = tails.get(key) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(task);
    tails.set(key, result);
    // Forget the key once nothing waits behind this task, so closed tabs leave no entries behind
    const forget = () => {
      if (tails.get(key) === result) tails.delete(key);
    };
    result.then(forget, forget);
    return result;
  };
}
