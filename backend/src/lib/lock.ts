/**
 * In-memory async keyed mutex to serialize concurrent requests for the same resource (e.g. mobileNumber).
 * Guarantees that parallel requests for the same mobile number never cause race conditions.
 */
class KeyedMutex {
  private locks = new Map<string, Promise<void>>();

  async acquire(key: string): Promise<() => void> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let release: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      release = () => {
        this.locks.delete(key);
        resolve();
      };
    });

    this.locks.set(key, lockPromise);
    return release;
  }
}

export const keyedMutex = new KeyedMutex();
