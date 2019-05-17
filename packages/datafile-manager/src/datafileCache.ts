/**
 * Copyright 2019, Optimizely
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// TODO: Log messages should be debug level instead of error?
// TODO: Should it be a write-through cache (memory, then storage, etc.). Maybe this is overcomplicating things.
// TODO: Accepting serialize/deserialize FNs, maybe not the best. could try refactor.
// TODO: maxCacheAge parameter handling

import { getLogger } from '@optimizely/js-sdk-logging'
import { LOCAL_STORAGE_KEY_PREFIX } from './config'
import { DatafileCacheEntry, DeserializationResult } from './datafileCacheEntry'

const logger = getLogger('DatafileManager')

// K is the type returned by getItem and accepted by setItem
export interface AsyncStorage<K> {
  getItem(key: string): Promise<K | null>
  setItem(key: string, value: K): Promise<void>
  removeItem(key: string): Promise<void>
}

// TODO: Refactor & share this logic for logging a maybe-error with same thing in httpPollingDatafileManager
function logError(maybeErr: any, messageTemplate: string): void {
  if (maybeErr instanceof Error) {
    logger.error(messageTemplate, maybeErr.message, maybeErr)
  } else {
    logger.error(messageTemplate, String(maybeErr))
  }
}

export interface DatafileCacheConfig<K> {
  // TODO: Does this need to return Promise, or can be sync?
  deserialize(storedItem: K): Promise<DeserializationResult<DatafileCacheEntry>>,
  sdkKey: string,
  serialize(entry: DatafileCacheEntry): Promise<K>
  storage: AsyncStorage<K>,
}

// K is the type used in the storage interface (for example, string for localStorage, maybe Object for localForage)
export default class DatafileCache<K> {
  private currentTimeouts: (() => void)[]

  private deserialize: (storedItem: K) => Promise<DeserializationResult<DatafileCacheEntry>>

  private serialize: (entry: DatafileCacheEntry) => Promise<K>

  private storage: AsyncStorage<K>

  private storageKey: string

  constructor({
    deserialize,
    serialize,
    sdkKey,
    storage,
  }: DatafileCacheConfig<K>) {
    this.deserialize = deserialize
    this.serialize = serialize
    this.storage = storage
    this.currentTimeouts = []
    this.storage = storage
    this.storageKey = `${LOCAL_STORAGE_KEY_PREFIX}_${sdkKey}`
  }

  // TODO: Comment explaining why we don't use a memory cache and instead call getItem every time
  async get(): Promise<DatafileCacheEntry | null> {
    let storedValue: K | null
    try {
      storedValue = await this.storage.getItem(this.storageKey)
    } catch (e) {
      logError(e, 'storage getItem error: %s')
      return null
    }

    if (storedValue === null) {
      return null
    }

    let result: DeserializationResult<DatafileCacheEntry>
    try {
      result = await this.deserialize(storedValue)
    } catch(ex) {
      logError(ex, 'Error deserializing stored entry: %s')
      return null
    }

    if (result.type === 'failure') {
      logError(result.error, 'Error parsing cache entry')
      return null
    }

    return result.entry
  }

  // Every set enqueues its own task to save to storage later.
  // Based on current requirements, this will be called once per second
  // at minimum, so we are not investing in a batching queue or some such
  // TODO: Double check this thought
  // TODO: This should return promise
  set(entry: DatafileCacheEntry): void {
    // TODO: Use requestIdleCallback
    const timeout = setTimeout(() => {
      this.saveToStorage(entry)
    })
    this.currentTimeouts.push(() => {
      clearTimeout(timeout)
    })
  }

  private async saveToStorage(entry: DatafileCacheEntry): Promise<void> {
    const itemToStore = await this.serialize(entry)
    const storageKey = this.storageKey
    try {
      // TODO: Should schedule another idle callback after serializing (which could have been expensive)
      // before doing this setItem?
      await this.storage.setItem(storageKey, itemToStore)
    } catch (err) {
      logError(err, 'storage setItem error: %s')
    }
  }

  stop(): void {
    this.currentTimeouts.forEach(cancel => cancel())
    this.currentTimeouts = []
  }
}
