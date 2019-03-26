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
// TODO change this to use Managed from js-sdk-models when available
import { Managed } from './managed'
import { generateUUID } from '@optimizely/js-sdk-utils'
import { HttpClient, EventV1Request } from './httpClient'
import { getLogger } from '@optimizely/js-sdk-logging'

const logger = getLogger('EventProcessor')

const MAX_FAILURE_COUNT = 5

type DispatchCallback = (success: boolean) => void

export interface EventDispatcher extends Managed {
  dispatch(event: EventV1Request, cb: DispatchCallback): void
}

export const enum EntryStatus {
  IN_PROGRESS,
  QUEUED,
}

export type DispatchEntry = {
  uuid: string
  status: EntryStatus
  failureCount: number
  request: EventV1Request
}

export class BufferedEventDispatcher implements EventDispatcher {
  protected buffer: {
    [key: string]: DispatchEntry
  }
  private httpClient: HttpClient
  private timeoutIds: number[]

  constructor({ httpClient }: { httpClient: HttpClient }) {
    this.buffer = {}
    this.httpClient = httpClient
    this.timeoutIds = []
  }

  start(): void {
    // dont start the timer until the first event is enqueued
  }

  stop(): Promise<any> {
    this.timeoutIds.forEach(id => {
      clearTimeout(id)
    })
    return Promise.resolve()
  }

  dispatch(event: EventV1Request, callback: DispatchCallback): void {
    const uuid = generateUUID()
    const entry = {
      uuid,
      failureCount: 0,
      status: EntryStatus.QUEUED,
      request: event,
    }
    this.enqueueAndDispatch(entry, callback)
  }

  protected enqueueAndDispatch(entry: DispatchEntry, callback: DispatchCallback): void {
    this.buffer[entry.uuid] = {
      ...entry,
      status: EntryStatus.IN_PROGRESS,
    }

    this.httpClient.dispatch(entry.request, success => {
      if (success) {
        this.handleSuccess(entry.uuid, callback)
      } else {
        this.handleFailure(entry.uuid, callback)
      }
    })
  }

  protected handleSuccess(uuid: string, callback: DispatchCallback) {
    delete this.buffer[uuid]
    callback(true)
  }

  protected handleFailure(uuid: string, callback: DispatchCallback) {
    const entry = this.buffer[uuid]
    if (!entry) {
      const err = new Error(`No buffer entry for uuid="${uuid}"`)
      logger.error(err)
      callback(false)
      throw err
    }

    const updatedEntry = {
      ...entry,
      failureCount: entry.failureCount + 1,
      status: EntryStatus.QUEUED,
    }

    if (updatedEntry.failureCount > MAX_FAILURE_COUNT) {
      delete this.buffer[uuid]
      callback(false)
      return
    }

    this.buffer[uuid] = entry
    this.timeoutIds.push(setTimeout(() => {
      this.enqueueAndDispatch(entry, callback)
    }, this.getNextTimeout(entry)) as any)
  }

  protected getNextTimeout(entry: DispatchEntry): number {
    const jitter = Math.round(1000 * Math.random())
    return 1000 * Math.pow(2, entry.failureCount) + jitter
  }
}