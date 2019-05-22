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

import { getLogger } from '@optimizely/js-sdk-logging'
import { Response } from './http'
import {
  DatafileCacheEntrySerializer,
  getResponseOfCacheEntry,
  getCacheEntryOfResponse,
} from './datafileCacheEntry'
import { AsyncStorage } from './storage'

const logger = getLogger('DatafileManager')

export default class DatafileResponseStorage<K> implements AsyncStorage<Response> {
  private storage: AsyncStorage<K>

  private serializer: DatafileCacheEntrySerializer<K>

  constructor(storage: AsyncStorage<K>, serializer: DatafileCacheEntrySerializer<K>) {
    this.storage = storage
    this.serializer = serializer
  }

  async getItem(key: string): Promise<Response | null> {
    const serializedEntry = await this.storage.getItem(key)
    if (serializedEntry === null) {
      return null
    }

    const result = this.serializer.deserialize(serializedEntry)

    if (result.type === 'failure') {
      logger.error('Error deserializing stored datafile: %s', result.error)
      return null
    }

    return getResponseOfCacheEntry(result.entry)
  }

  // TODO: Validation. This could be any response, but only want to cache certain ones.
  // Not sure this validation belongs here. If not, then it should accept a DatafileResponse
  // type which is known to be valid & cacheable.
  setItem(key: string, response: Response): Promise<void> {
    const cacheEntry = getCacheEntryOfResponse(response)
    const serializedEntry = this.serializer.serialize(cacheEntry)
    return this.storage.setItem(key, serializedEntry)
  }

  removeItem(key: string): Promise<void> {
    return this.storage.removeItem(key)
  }
}
