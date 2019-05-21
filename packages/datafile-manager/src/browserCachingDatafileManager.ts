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

// TODO: localForage/IndexedDB can store full objects.
// We can store the actual configObj, not the datafile, for fast initialization

import { makeGetRequest } from './browserRequest'
import HttpPollingDatafileManager from './httpPollingDatafileManager'
import { Headers, AbortableRequest, Response } from './http'
import { DatafileManagerConfig } from './datafileManager'
import { LocalForageShim, serialize, deserialize } from './localForageDatafileCache'
import DatafileCache from './datafileCache'
import { getLogger } from '@optimizely/js-sdk-logging'

const logger = getLogger('CachingDatafileManager')

export enum CacheRefreshDirective {
  ONLY_IF_CACHE_MISS = 'ONLY_IF_CACHE_MISS',
  YES_DONT_AWAIT = 'YES_DONT_AWAIT',
  // TODO: The YES_WAIT option is equivalent to not using the cache, so it should be removed.
  // Maybe this whole thing should be replaced with a boolean instead since there are only two valid options.
  YES_AWAIT = 'YES_AWAIT',
}

// TODO: Add maxCacheAge
export interface BrowserCachingDatafileManagerConfig extends DatafileManagerConfig {
  refreshDirective?: CacheRefreshDirective
}

export default class BrowserCachingDatafileManager extends HttpPollingDatafileManager {
  private static localForageShim: LocalForageShim = new LocalForageShim()

  private datafileCache: DatafileCache<object>

  private refreshDirective: CacheRefreshDirective

  constructor(config: BrowserCachingDatafileManagerConfig) {
    super(config)

    this.datafileCache = new DatafileCache<object>({
      deserialize,
      serialize,
      sdkKey: config.sdkKey,
      storage: BrowserCachingDatafileManager.localForageShim,
    })

    this.refreshDirective =
      config.refreshDirective || CacheRefreshDirective.YES_DONT_AWAIT
  }

  private async getRequestPromiseUsingCache(
    reqUrl: string,
    headers: Headers,
    isAborted: () => boolean,
    setRealRequest: (realRequest: AbortableRequest) => void,
  ): Promise<Response> {
    logger.debug('Checking for cache entry')
    let cacheEntry = await this.datafileCache.get()

    if (isAborted()) {
      throw new Error('Request aborted')
    }

    let cachedResponse: Response | undefined
    if (cacheEntry) {
      logger.debug('Cache entry exists, using it: %s', () => JSON.stringify(cacheEntry))
      const fakeHeaders: Headers = {}
      if (cacheEntry.lastModified) {
        fakeHeaders['Last-Modified'] = cacheEntry.lastModified
      }
      cachedResponse = {
        // TODO: it's weird...this is not really an HTTP response
        // Might need to change the types around a bit here
        statusCode: 200,
        // TODO: This is wrong. Stringifyin it just to parse it again later
        // Need to change around types
        body: JSON.stringify(cacheEntry.datafile),
        headers: fakeHeaders,
      }
    }

    if (cachedResponse && this.refreshDirective === CacheRefreshDirective.ONLY_IF_CACHE_MISS) {
      return cachedResponse
    }

    logger.debug('Making real request')
    const realRequest = makeGetRequest(reqUrl, headers)
    setRealRequest(realRequest)

    this.refreshCacheFromResponse(realRequest)

    if (this.refreshDirective === CacheRefreshDirective.YES_AWAIT || !cachedResponse) {
      const realResponse = await realRequest.responsePromise
      return realResponse
    } else {
      return cachedResponse
    }
  }

  private async refreshCacheFromResponse(request: AbortableRequest) {
    // TODO: Only save cache entry if valid. Needs same logic that checks response in HttpPollingDatafileManager
    const response = await request.responsePromise
    if (response.body) {
      let responseObj: object
      try {
        responseObj = JSON.parse(response.body)
      } catch (ex) {
        logger.error('Error parsing response body: %s', ex)
        return
      }
      if (responseObj === null || typeof responseObj !== 'object') {
        logger.error('Error parsing response body: wrong type')
        return
      }

      const cacheEntry = {
        timestamp: Date.now(),
        datafile: responseObj,
        lastModified:
          response.headers['Last-Modified'] || response.headers['last-modified'],
      }
      logger.debug('Saving cache entry: %s', () => JSON.stringify(cacheEntry))
      this.datafileCache.set(cacheEntry)
    } else {
      logger.debug('Response had no body')
    }
  }

  protected makeGetRequest(reqUrl: string, headers: Headers): AbortableRequest {
    let aborted: boolean = false
    let realRequest: AbortableRequest | undefined
    return {
      abort() {
        aborted = true
        if (realRequest) {
          realRequest.abort()
        }
      },
      responsePromise: this.getRequestPromiseUsingCache(
        reqUrl,
        headers,
        () => aborted,
        rr => {
          realRequest = rr
        },
      ),
    }
  }

  protected getConfigDefaults(): Partial<DatafileManagerConfig> {
    return {
      autoUpdate: false,
    }
  }
}
