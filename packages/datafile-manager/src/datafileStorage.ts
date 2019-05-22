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
import { AsyncStorage } from './storage'
import { DatafileCacheEntry } from './datafileCacheEntry';
import { DatafileCacheEntrySerializer } from './datafileCacheSerializer';

const logger = getLogger('DatafileManager')

// K is the type used in the storage interface
export default class DatafileStorage<K> implements AsyncStorage<DatafileCacheEntry> {
  private storage: AsyncStorage<K>

  private serializer: DatafileCacheEntrySerializer<K>

  constructor(storage: AsyncStorage<K>, serializer: DatafileCacheEntrySerializer<K>) {
    this.storage = storage
    this.serializer = serializer
  }

  async getItem(key: string): Promise<DatafileCacheEntry | null> {
    const serializedEntry = await this.storage.getItem(key)
    if (serializedEntry === null) {
      return null
    }

    const result = this.serializer.deserialize(serializedEntry)

    if (result.type === 'failure') {
      logger.error('Error deserializing stored datafile: %s', result.error)
      return null
    } else {
      return result.entry
    }
  }

  setItem(key: string, entry: DatafileCacheEntry): Promise<void> {
    const serializedEntry = this.serializer.serialize(entry)
    return this.storage.setItem(key, serializedEntry)
  }

  removeItem(key: string): Promise<void> {
    return this.storage.removeItem(key)
  }
}
