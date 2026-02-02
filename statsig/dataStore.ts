/**
 * Interface for your internal cache (e.g., Redis client wrapper)
 */
export interface ICacheProvider {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string): Promise<void> | void;
}

export class DataStore {
  private cache: ICacheProvider;

  constructor(cache: ICacheProvider) {
    this.cache = cache;
  }

  // Statsig SDK looks for these exact method signatures:
  
  async get(key: string): Promise<string | null> {
    const result = await this.cache.get(key);
    return result ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.cache.set(key, value);
  }

  async init(): Promise<void> {
    return Promise.resolve();
  }

  async shutdown(): Promise<void> {
    return Promise.resolve();
  }
}