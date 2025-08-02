/**
 * Caching utilities for API responses and data
 */

import React from 'react';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
}

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  stale?: boolean;
}

// In-memory cache implementation
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    
    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      if (this.config.staleWhileRevalidate) {
        entry.stale = true;
        return entry.data;
      } else {
        this.cache.delete(key);
        return null;
      }
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired && !this.config.staleWhileRevalidate) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    return entry?.stale || false;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl && !this.config.staleWhileRevalidate) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        stale: entry.stale,
      })),
    };
  }
}

// Browser storage cache implementation
class BrowserStorageCache {
  private storage: Storage;
  private prefix: string;

  constructor(storage: Storage = localStorage, prefix: string = 'app-cache-') {
    this.storage = storage;
    this.prefix = prefix;
  }

  set<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to cache data in browser storage:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();
      const isExpired = now - entry.timestamp > entry.ttl;

      if (isExpired) {
        this.storage.removeItem(this.prefix + key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data from browser storage:', error);
      return null;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    try {
      this.storage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.warn('Failed to delete cached data from browser storage:', error);
      return false;
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(this.storage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache from browser storage:', error);
    }
  }
}

// Cache instances
export const memoryCache = new MemoryCache({
  ttl: 300000, // 5 minutes
  maxSize: 1000,
  staleWhileRevalidate: true,
});

export const browserCache = typeof window !== 'undefined' 
  ? new BrowserStorageCache(localStorage, 'idara-cache-')
  : null;

// API response caching wrapper
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: { ttl?: number; useMemory?: boolean; useBrowser?: boolean } = {}
): Promise<T> {
  const {
    ttl = 300000, // 5 minutes default
    useMemory = true,
    useBrowser = false,
  } = cacheOptions;

  const cacheKey = `fetch-${url}-${JSON.stringify(options)}`;

  // Try memory cache first
  if (useMemory) {
    const cached = memoryCache.get<T>(cacheKey);
    if (cached !== null) {
      // If stale, fetch in background
      if (memoryCache.isStale(cacheKey)) {
        fetch(url, options)
          .then(response => response.json())
          .then(data => memoryCache.set(cacheKey, data, ttl))
          .catch(console.error);
      }
      return cached;
    }
  }

  // Try browser cache
  if (useBrowser && browserCache) {
    const cached = browserCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch fresh data
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: T = await response.json();

  // Cache the result
  if (useMemory) {
    memoryCache.set(cacheKey, data, ttl);
  }
  if (useBrowser && browserCache) {
    browserCache.set(cacheKey, data, ttl);
  }

  return data;
}

// React hook for cached data fetching
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    useMemory?: boolean;
    useBrowser?: boolean;
    revalidateOnFocus?: boolean;
  } = {}
) {
  const {
    ttl = 300000,
    useMemory = true,
    useBrowser = false,
    revalidateOnFocus = true,
  } = options;

  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      let cachedData: T | null = null;
      
      if (useMemory) {
        cachedData = memoryCache.get<T>(key);
      }
      
      if (!cachedData && useBrowser && browserCache) {
        cachedData = browserCache.get<T>(key);
      }

      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        
        // If stale, fetch in background
        if (useMemory && memoryCache.isStale(key)) {
          const freshData = await fetcher();
          memoryCache.set(key, freshData, ttl);
          if (useBrowser && browserCache) {
            browserCache.set(key, freshData, ttl);
          }
          setData(freshData);
        }
        return;
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the result
      if (useMemory) {
        memoryCache.set(key, freshData, ttl);
      }
      if (useBrowser && browserCache) {
        browserCache.set(key, freshData, ttl);
      }

      setData(freshData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, useMemory, useBrowser]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Revalidate on window focus
  React.useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      if (useMemory && memoryCache.isStale(key)) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, fetchData, revalidateOnFocus, useMemory]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache: () => {
      if (useMemory) memoryCache.delete(key);
      if (useBrowser && browserCache) browserCache.delete(key);
    },
  };
}

// Cache invalidation utilities
export function invalidateCache(pattern: string) {
  // Invalidate memory cache
  const memoryStats = memoryCache.getStats();
  memoryStats.entries.forEach(entry => {
    if (entry.key.includes(pattern)) {
      memoryCache.delete(entry.key);
    }
  });

  // Invalidate browser cache
  if (browserCache) {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('idara-cache-') && key.includes(pattern)
      );
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to invalidate browser cache:', error);
    }
  }
}

export function clearAllCaches() {
  memoryCache.clear();
  if (browserCache) {
    browserCache.clear();
  }
}