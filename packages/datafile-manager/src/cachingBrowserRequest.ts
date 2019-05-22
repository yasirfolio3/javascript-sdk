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

import { makeGetRequest as makeRealGetRequest } from './browserRequest'
import { AbortableRequest, Headers, Response } from './http'
import { AsyncStorage } from './storage'

export enum CacheDirective {
  CACHE_FIRST = 'CACHE_FIRST',
  NETWORK_FIRST = 'NETWORK_FIRST',
  STALE_WHILE_REVALIDATE = 'STALE_WHILE_REVALIDATE',
}

// TODO: Implement maxCacheAge parameter
export function makeGetRequestThroughCache(
  reqUrl: string,
  headers: Headers,
  cache: AsyncStorage<Response>,
  directive: CacheDirective,
): AbortableRequest {
  switch (directive) {
    case CacheDirective.CACHE_FIRST:
      return makeCacheFirstRequest(reqUrl, headers, cache)

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
  cache: AsyncStorage<Response>
): AbortableRequest {
  let isAborted = false
  let realReq: AbortableRequest | undefined

  const responsePromise: Promise<Response> = new Promise(async (resolve, reject) => {
    const cacheEntry = await cache.getItem(reqUrl)
    if (isAborted) {
      reject(new Error('Request aborted'))
      return
    }
    if (cacheEntry) {
      resolve(cacheEntry)
      return
    }
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
