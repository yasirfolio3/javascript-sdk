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

import HttpPollingDatafileManager from './httpPollingDatafileManager'
import { AbortableRequest, Headers } from './http'
import { DatafileManagerConfig } from './datafileManager'
import DatafileResponseStorage from './datafileResponseStorage'
import { CacheDirective, makeGetRequestThroughCache, saveResponseToCache } from './cachingBrowserRequest'
import localStorage from './localStorage'
import { jsonStringSerializer } from './datafileCacheEntry'

export interface CachingBrowserDatafileManagerConfig<K> extends DatafileManagerConfig {
  cacheDirective: CacheDirective
  storage: DatafileResponseStorage<K>
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
    // TODO: Use LOCAL_STORAGE_KEY_PREFIX to form a cache key

    const request = makeGetRequestThroughCache(
      reqUrl,
      headers,
      this.config.storage,
      this.config.cacheDirective || CacheDirective.CACHE_FIRST,
    )

    request.responsePromise.then(response => {
      saveResponseToCache(
        this.config.storage,
        reqUrl,
        response
      )
    })

    return request
  }

  protected getConfigDefaults(): Partial<DatafileManagerConfig> {
    return {
      autoUpdate: false,
    }
  }

  static defaultInstance(
    config: DatafileManagerConfig,
  ): CachingBrowserDatafileManager<string> {
    return new CachingBrowserDatafileManager({
      ...config,
      storage: new DatafileResponseStorage(localStorage, jsonStringSerializer),
      cacheDirective: CacheDirective.CACHE_FIRST,
    })
  }
}
