import DatafileStorage from "./datafileStorage";
import { Response } from './http'
import { getResponseOfCacheEntry, getCacheEntryOfResponse } from './datafileCacheEntry'
import { AsyncStorage } from './storage'
import { DatafileCacheEntrySerializer } from './datafileCacheSerializer'

export default class DatafileResponseStorage<K> implements AsyncStorage<Response> {
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

  // TODO: Validation. This could be any response, but only want to cache certain ones.
  // Not sure this validation belongs here. If not, then it should accept a DatafileResponse
  // type which is known to be valid & cacheable.
  setItem(key: string, response: Response): Promise<void> {
    return this.datafileStorage.setItem(key, getCacheEntryOfResponse(response))
  }

  removeItem(key: string): Promise<void> {
    return this.datafileStorage.removeItem(key)
  }
}
