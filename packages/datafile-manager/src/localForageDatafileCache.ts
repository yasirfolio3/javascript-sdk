import localForage from 'localforage'
import { AsyncStorage } from "./datafileCache";
import { DatafileCacheEntry, DeserializationResult, deserializeObject } from './datafileCacheEntry';
// export interface AsyncStorage<K> {
//   getItem(key: string): Promise<K | null>
//   setItem(key: string, value: K): Promise<void>
//   removeItem(key: string): Promise<void>
// }

export class LocalForageShim implements AsyncStorage<object> {
  constructor() {
    localForage.config({
      name: 'optly_js_sdk_config',
      description: 'Stores cache entries containing Optimizely SDK datafiles',
    })
  }

  getItem(key: string): Promise<object | null> {
    return localForage.getItem(key)
  }

  async setItem(key: string, value: object): Promise<void> {
    await localForage.setItem(key, value)
  }

  removeItem(key: string): Promise<void> {
    return localForage.removeItem(key)
  }
}

export function serialize(entry: DatafileCacheEntry): Promise<object> {
  return Promise.resolve(entry)
}

export async function deserialize(storedItem: object): Promise<DeserializationResult<DatafileCacheEntry>> {
  return deserializeObject(storedItem)
}
