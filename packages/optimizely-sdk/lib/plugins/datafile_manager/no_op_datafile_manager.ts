/**
 * Copyright 2021, 2023, Optimizely
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
import { DatafileManager, DatafileUpdateListener } from '../../shared_types';

/**
 * No-operation Datafile Manager for Lite Bundle designed for Edge platforms
 * https://github.com/optimizely/javascript-sdk/issues/699
 */
class NoOpDatafileManager implements DatafileManager {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  on(_eventName: string, _listener: DatafileUpdateListener): () => void {
    return (): void => {};
  }

  get(): string {
    return '';
  }

  onReady(): Promise<void> {
    return Promise.resolve();
  }

  start(): void {}

  stop(): Promise<void> {
    return Promise.resolve();
  }
}

export function createNoOpDatafileManager(): DatafileManager {
  return new NoOpDatafileManager();
}
