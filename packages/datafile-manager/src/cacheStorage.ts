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

import { AsyncStorage } from './storage'

function openCache() {
  return caches.open('optimizely_js_sdk_datafiles_v1')
}

const cacheInterface: AsyncStorage<Response> = {
  async getItem(key: string): Promise<Response | null> {
    const cache = await openCache()
    const response = await cache.match(key)
    return response || null
  },

  async setItem(key: string, response: Response): Promise<void> {
    const cache = await openCache()
    cache.put(key, response)
  },

  async removeItem(key: string): Promise<void> {
    const cache = await openCache()
    cache.delete(key)
  },
}

export default cacheInterface
