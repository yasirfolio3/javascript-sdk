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
import { objectValues } from '@optimizely/js-sdk-utils'
import {
  BufferedEventDispatcher,
  DispatchEntry,
  EntryStatus,
} from './eventDispatcher'
import { getLogger } from '@optimizely/js-sdk-logging'

const logger = getLogger('EventProcessor')

const LS_KEY = 'optly_fs_event_queue'

export class BrowserEventDispatcher extends BufferedEventDispatcher {
  start(): void {
    super.start()
    const data = window.localStorage.getItem(LS_KEY)
    try {
      if (data) {
        const parsed = JSON.parse(data) as DispatchEntry[]
        parsed.forEach((item: DispatchEntry) => {
          this.enqueueAndDispatch(item, () => {})
        })
      }
    } catch (e) {
      logger.error('Error starting BrowserDispatchQueue: "%s"', e.message, e)
    }

    window.localStorage.removeItem(LS_KEY)
  }

  stop(): Promise<any> {
    try {
      super.stop()
      const toSave = objectValues(this.buffer).map(obj => ({
        ...obj,
        status: EntryStatus.QUEUED,
      }))
      window.localStorage.setItem(LS_KEY, JSON.stringify(toSave))
    } catch (e) {
      logger.error('Error stopping BrowserDispatchQueue: "%s"', e.message, e)
    }
    return Promise.resolve()
  }
}
