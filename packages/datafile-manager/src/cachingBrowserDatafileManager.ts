import HttpPollingDatafileManager from './httpPollingDatafileManager'
import { Headers, AbortableRequest } from './http'
import { DatafileManagerConfig } from './datafileManager'
import DatafileResponseStorage from './datafileResponseStorage'
import { makeGetRequestThroughCache, CacheDirective } from './cachingBrowserRequest'
import LocalStorage from './localStorage';
import { serializeToJsonString, deserializeJsonString } from './datafileCacheEntry';

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

export interface CachingBrowserDatafileManagerConfig<K> extends DatafileManagerConfig {
  storage: DatafileResponseStorage<K>
  cacheDirective: CacheDirective
}

export default class CachingBrowserDatafileManager<
  K
> extends HttpPollingDatafileManager {
  private config: CachingBrowserDatafileManagerConfig<K>

  constructor(config: CachingBrowserDatafileManagerConfig<K>) {
    super(config)
    this.config = config
  }

  makeGetRequest(reqUrl: string, headers: Headers): AbortableRequest {
    return makeGetRequestThroughCache(
      reqUrl,
      headers,
      this.config.storage,
      this.config.cacheDirective,
    )
    // TODO: Use LOCAL_STORAGE_KEY_PREFIX
  }

  protected getConfigDefaults(): Partial<DatafileManagerConfig> {
    return {
      autoUpdate: false,
    }
  }

  static defaultInstance(config: DatafileManagerConfig): CachingBrowserDatafileManager<string> {
    return new CachingBrowserDatafileManager({
      ...config,
      storage: new DatafileResponseStorage(
        new LocalStorage(),
        {
          serialize: serializeToJsonString,
          deserialize: deserializeJsonString,
        }
      ),
      cacheDirective: CacheDirective.CACHE_FIRST,
    })
  }
}
