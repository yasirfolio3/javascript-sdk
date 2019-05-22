import { ResponseStorage } from "./responseStorage";
import DatafileStorage from "./datafileStorage";
import { Response } from './http'
import { getResponseOfCacheEntry, getCacheEntryOfResponse } from './datafileCacheEntry'
import { AsyncStorage } from './storage'
import { DatafileCacheEntrySerializer } from './datafileCacheSerializer'

export default class DatafileResponseStorage<K> implements ResponseStorage {
  private datafileStorage: DatafileStorage<K>

  constructor(storage: AsyncStorage<K>, serializer: DatafileCacheEntrySerializer<K>) {
    this.datafileStorage = new DatafileStorage(storage, serializer)
  }

  async getItem(key: string): Promise<Response | null> {
    const cacheEntry = await this.datafileStorage.getItem(key)
    if (cacheEntry) {
      return getResponseOfCacheEntry(cacheEntry)
    }
    return null
  }

  setItem(key: string, response: Response): Promise<void> {
    return this.datafileStorage.setItem(key, getCacheEntryOfResponse(response))
  }

  removeItem(key: string): Promise<void> {
    return this.datafileStorage.removeItem(key)
  }
}
