import { default as DatafileCache, AsyncStorage, DatafileCacheConfig } from '../src/datafileCache'
import { advanceTimersByTime } from './testUtils'
import { DatafileCacheEntry } from '../src/datafileCacheEntry';

describe('datafileCache', () => {
  class FakeStorage implements AsyncStorage<string> {
    getItem = jest.fn().mockResolvedValue(null)
    setItem = jest.fn().mockResolvedValue(undefined)
    removeItem = jest.fn().mockResolvedValue(undefined)
  }

  const fakeStorage = new FakeStorage()

  let cache: DatafileCache<string>
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    if (cache) {
      cache.stop()
    }
    jest.resetAllMocks()
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('set', () => {
    it('sets a timeout to save item to storage', async () => {
      const config: DatafileCacheConfig<string> = {
        deserialize: jest.fn(),
        serialize: jest.fn().mockReturnValue('&*(&*(&*()*()'),
        sdkKey: '123',
        storage: fakeStorage,
      }
      cache = new DatafileCache(config)
      const cacheEntry = {
        timestamp: 1553273928953,
        datafile: '{"foo":"bar"}',
      }
      cache.set(cacheEntry)
      await advanceTimersByTime(1)
      expect(fakeStorage.setItem).toBeCalledTimes(1)

      const actualKey = fakeStorage.setItem.mock.calls[0][0]
      const expectedKey = 'optly_js_sdk_datafile__123'
      expect(actualKey).toBe(expectedKey)

      expect(config.serialize).toBeCalledTimes(1)
      expect(config.serialize).toBeCalledWith(cacheEntry)

      const actualStoredValue = fakeStorage.setItem.mock.calls[0][1]
      const expectedStoredValue = '&*(&*(&*()*()'
      expect(actualStoredValue).toBe(expectedStoredValue)
    })
  })

  describe('get', () => {
    it('gets the item from storage', async () => {
      fakeStorage.getItem.mockReturnValueOnce('7&*&*787&*(xxx')

      const config: DatafileCacheConfig<string> = {
        deserialize: jest.fn().mockReturnValue({
          type: 'success',
          entry: {
            datafile: '{"fooz":"barz"}',
            lastModified: 'Fri, 03 May 2019 18:20:52 GMT',
            timestamp: 1553273928953,
          }
        }),
        serialize: jest.fn(),
        sdkKey: '123',
        storage: fakeStorage,
      }
      cache = new DatafileCache(config)
      const result = await cache.get()

      expect(fakeStorage.getItem).toBeCalledTimes(1)
      const actualKey = fakeStorage.getItem.mock.calls[0][0]
      const expectedKey = 'optly_js_sdk_datafile__123'
      expect(actualKey).toBe(expectedKey)

      expect(config.deserialize).toBeCalledTimes(1)
      expect(config.deserialize).toBeCalledWith('7&*&*787&*(xxx')

      expect(result).not.toBe(null)
      expect(result as DatafileCacheEntry).toEqual({
        datafile: '{"fooz":"barz"}',
        lastModified: 'Fri, 03 May 2019 18:20:52 GMT',
        timestamp: 1553273928953,
      })
    })
  })
})
