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

// TODO: The K type variable is leaking everywhere. Make it so most consumers don't need to care

import { getLogger } from '@optimizely/js-sdk-logging'
import { AbortableRequest, Headers, Response } from './http'
import { AsyncStorage } from './storage'

export enum CacheDirective {
  CACHE_FIRST = 'CACHE_FIRST',
  NETWORK_FIRST = 'NETWORK_FIRST',
  STALE_WHILE_REVALIDATE = 'STALE_WHILE_REVALIDATE',
}

const logger = getLogger('DatafileManager')

// TODO: Implement maxCacheAge parameter
// TODO: We could expect freshness to be implemented inside the storage adapter. IF we did this, would it "just work" in the Cache-based adapter?
export function makeGetRequestThroughCache(
  cache: AsyncStorage<Response>,
  reqUrl: string,
  headers: Headers,
  directive: CacheDirective,
  makeRealGetRequest: (reqUrl: string, headers: Headers) => AbortableRequest
): AbortableRequest {
  switch (directive) {
    case CacheDirective.CACHE_FIRST:
      return makeCacheFirstRequest(reqUrl, headers, cache, makeRealGetRequest)

    default:
      return {
        abort() {},
        responsePromise: Promise.reject(new Error('Directive NYI: ' + directive)),
      }
  }
}

function makeCacheFirstRequest(
  reqUrl: string,
  headers: Headers,
  cache: AsyncStorage<Response>,
  makeRealGetRequest: (reqUrl: string, headers: Headers) => AbortableRequest
): AbortableRequest {
  let isAborted = false
  let realReq: AbortableRequest | undefined

  const responsePromise: Promise<Response> = new Promise(async (resolve, reject) => {
    const cacheEntry = await cache.getItem(reqUrl)
    if (isAborted) {
      reject(new Error('Request aborted'))
      return
    }
    // TODO: Must check that cache entry is not expired before using
    if (cacheEntry) {
      logger.debug('Cache hit for request url %s', reqUrl)
      resolve(cacheEntry)
      // TODO: Is this even right? Do I refresh the cache when there's a hit?
      return
    }

    logger.debug('Cache miss for request url %s', reqUrl)

    realReq = makeRealGetRequest(reqUrl, headers)
    // TODO: Implement saving responses to cache - but how & where? Perhaps not here.
    // We would probably want the same logic from httpPollingDatafileManager to determine whether a response should be cached.
    resolve(realReq.responsePromise)
  })

  return {
    abort() {
      isAborted = true
      if (realReq) {
        realReq.abort()
      }
    },
    responsePromise,
  }
}

export function saveResponseToCache(
  cache: AsyncStorage<Response>,
  reqUrl: string,
  response: Response,
): boolean {
  let shouldCacheResponse = false
  if (
    typeof response.statusCode !== 'undefined' &&
    response.statusCode >= 200 &&
    response.statusCode < 400 &&
    response.body !== ''
  ) {
    try {
      JSON.parse(response.body)
      shouldCacheResponse = true
    } catch (ex) {
    }
  }

  if (shouldCacheResponse) {
    // TODO: Don't want to cache it if the body is not valid JSON
    // How to implement this?
    logger.debug('Saving response to cache, request url %s, response %s', reqUrl, response.statusCode)
    cache.setItem(reqUrl, response)
  }

  return shouldCacheResponse
}
