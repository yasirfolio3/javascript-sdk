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
import { EventDispatcher, EventV1Request } from './eventDispatcher'
import { EventV1 } from './v1/buildEventV1'
import { getLogger } from '@optimizely/js-sdk-logging'
export type EventQueueSink<K> = (buffer: K[]) => Promise<any>

const logger = getLogger('EventProcessor')

const MAX_FAILURE_COUNT = 5

type EnqueueCallback = (success: boolean) => void

export interface DispatchQueue extends Managed {
  enqueue(event: EventV1Request, cb: EnqueueCallback): void
}

export const enum EntryStatus {
  IN_PROGRESS,
  QUEUED,
}

export type DispatchQueueEntry = {
  uuid: string
  status: EntryStatus
  failureCount: number
  request: EventV1Request
}

export class BaseDispatchQueue implements DispatchQueue {
  protected buffer: {
    [key: string]: DispatchQueueEntry
  }
  private dispatcher: EventDispatcher
  private timeoutIds: number[]

  constructor({ dispatcher }: { dispatcher: EventDispatcher }) {
    this.buffer = {}
    this.dispatcher = dispatcher
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

  enqueue(event: EventV1Request, callback: EnqueueCallback): void {
    const uuid = generateUUID()
    const entry = {
      uuid,
      failureCount: 0,
      status: EntryStatus.QUEUED,
      request: event,
    }
    this.dispatch(entry, callback)
  }

  protected dispatch(entry: DispatchQueueEntry, callback: EnqueueCallback): void {
    this.buffer[entry.uuid] = {
      ...entry,
      status: EntryStatus.IN_PROGRESS,
    }

    this.dispatcher.dispatch(entry.request, success => {
      if (success) {
        this.handleSuccess(entry.uuid, callback)
      } else {
        this.handleFailure(entry.uuid, callback)
      }
    })
  }

  protected handleSuccess(uuid: string, callback: EnqueueCallback) {
    delete this.buffer[uuid]
    callback(true)
  }

  protected handleFailure(uuid: string, callback: EnqueueCallback) {
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
    this.timeoutIds.push(
      setTimeout(() => {
        this.dispatch(entry, callback)
      }, this.getNextTimeout(entry)),
    )
  }

  protected getNextTimeout(entry: DispatchQueueEntry): number {
    const jitter = Math.round(1000 * Math.random())
    return 1000 * Math.pow(2, entry.failureCount) + jitter
  }
}
