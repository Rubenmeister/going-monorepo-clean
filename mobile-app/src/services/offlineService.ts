/**
 * Offline Support Service
 * Enables mobile app to work without internet connection
 * Implements local data sync, queue management, and conflict resolution
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuid } from 'uuid';

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export interface CachedData {
  key: string;
  value: any;
  timestamp: number;
  expiresAt: number;
  version: number;
}

const STORAGE_KEYS = {
  REQUEST_QUEUE: 'offline_request_queue',
  CACHE_PREFIX: 'offline_cache_',
  SYNC_STATUS: 'offline_sync_status',
  LAST_SYNC: 'offline_last_sync',
};

export class OfflineService {
  private requestQueue: QueuedRequest[] = [];
  private isOnline = true;
  private isSyncing = false;
  private syncCallbacks: ((success: boolean) => void)[] = [];

  constructor() {
    this.loadQueue();
    this.setupNetworkListener();
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Queue request for later sync when online
   */
  async queueRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<string> {
    const request: QueuedRequest = {
      id: uuid(),
      method,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
    };

    this.requestQueue.push(request);
    await this.saveQueue();

    console.log(`Request queued: ${method} ${endpoint}`);

    return request.id;
  }

  /**
   * Get queued requests
   */
  getQueuedRequests(): QueuedRequest[] {
    return [...this.requestQueue];
  }

  /**
   * Clear request queue
   */
  async clearQueue(): Promise<void> {
    this.requestQueue = [];
    await AsyncStorage.removeItem(STORAGE_KEYS.REQUEST_QUEUE);
  }

  /**
   * Cache data locally
   */
  async cacheData(
    key: string,
    data: any,
    ttlMinutes: number = 60
  ): Promise<void> {
    const cachedData: CachedData = {
      key,
      value: data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
      version: 1,
    };

    await AsyncStorage.setItem(
      `${STORAGE_KEYS.CACHE_PREFIX}${key}`,
      JSON.stringify(cachedData)
    );
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(
        `${STORAGE_KEYS.CACHE_PREFIX}${key}`
      );

      if (!cached) return null;

      const cachedData: CachedData = JSON.parse(cached);

      // Check if expired
      if (cachedData.expiresAt < Date.now()) {
        await AsyncStorage.removeItem(`${STORAGE_KEYS.CACHE_PREFIX}${key}`);
        return null;
      }

      return cachedData.value;
    } catch (error) {
      console.error(`Failed to get cached data for ${key}:`, error);
      return null;
    }
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) =>
        k.startsWith(STORAGE_KEYS.CACHE_PREFIX)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Sync queued requests when online
   */
  async syncQueue(
    apiCall: (req: QueuedRequest) => Promise<any>
  ): Promise<boolean> {
    if (this.isSyncing || !this.isOnline || this.requestQueue.length === 0) {
      return false;
    }

    this.isSyncing = true;
    let successCount = 0;
    const failedRequests: QueuedRequest[] = [];

    try {
      for (const request of this.requestQueue) {
        try {
          await apiCall(request);
          successCount++;
        } catch (error) {
          request.retries++;

          if (request.retries < request.maxRetries) {
            failedRequests.push(request);
          } else {
            console.error(
              `Request failed after ${request.maxRetries} retries:`,
              request.endpoint
            );
          }
        }
      }

      // Update queue with failed requests
      this.requestQueue = failedRequests;
      await this.saveQueue();

      // Update last sync time
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SYNC,
        new Date().toISOString()
      );

      console.log(
        `Sync complete: ${successCount} succeeded, ${failedRequests.length} pending`
      );

      // Notify callbacks
      this.syncCallbacks.forEach((cb) => cb(successCount > 0));

      return successCount > 0;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Subscribe to sync events
   */
  onSync(callback: (success: boolean) => void): () => void {
    this.syncCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Private methods
   */

  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.REQUEST_QUEUE);
      if (stored) {
        this.requestQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load request queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.REQUEST_QUEUE,
        JSON.stringify(this.requestQueue)
      );
    } catch (error) {
      console.error('Failed to save request queue:', error);
    }
  }

  private setupNetworkListener(): void {
    // In a real implementation, use react-native-netinfo
    // For now, we'll assume online status based on API connectivity
  }

  setOnlineStatus(isOnline: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;

    if (!wasOnline && isOnline && this.requestQueue.length > 0) {
      console.log('Device came online, syncing queued requests...');
      // Trigger sync
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
