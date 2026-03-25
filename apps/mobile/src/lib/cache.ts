import { getItem, setItem } from './storage';

type CachedValue<T> = {
  timestamp: number;
  data: T;
};

export async function readCached<T>(key: string): Promise<CachedValue<T> | null> {
  return getItem<CachedValue<T>>(key);
}

export async function writeCached<T>(key: string, data: T): Promise<void> {
  await setItem<CachedValue<T>>(key, {
    timestamp: Date.now(),
    data,
  });
}

export async function fetchWithReadCache<T>(params: {
  cacheKey: string;
  fetcher: () => Promise<T>;
}): Promise<T> {
  try {
    const data = await params.fetcher();
    await writeCached(params.cacheKey, data);
    return data;
  } catch (error) {
    const cached = await readCached<T>(params.cacheKey);
    if (cached) {
      return cached.data;
    }
    throw error;
  }
}
