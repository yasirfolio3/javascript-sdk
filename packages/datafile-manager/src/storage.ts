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

export interface Storage<K> {
  getItem(key: string): K | null
  setItem(key: string, value: K): void
  removeItem(key: string): void
}

export interface AsyncStorage<K> {
  getItem(key: string): Promise<K | null>
  setItem(key: string, value: K): Promise<void>
  removeItem(key: string): Promise<void>
}
