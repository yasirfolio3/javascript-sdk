import { default as DatafileCache, AsyncStorage } from '../src/datafileCache'
// import DatafileCacheEntry from '../src/datafileCacheEntry'
import { advanceTimersByTime } from './testUtils'

describe('datafileCache', () => {
  class FakeStorage implements AsyncStorage {
    getItem = jest.fn().mockResolvedValue(null)
    setItem = jest.fn().mockResolvedValue(undefined)
    removeItem = jest.fn().mockResolvedValue(undefined)
  }

  const fakeStorage = new FakeStorage()

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('set', () => {
    it('sets a timeout to save item to storage', async () => {
      const cache = new DatafileCache({
        storage: fakeStorage,
        sdkKey: '123',
      })
      const cacheEntry = {
        timestamp: 1553273928953,
        datafile: '{"foo":"bar"}',
      }
      cache.set(cacheEntry)
      await advanceTimersByTime(1)
      expect(fakeStorage.setItem).toBeCalledTimes(1)
      const actualKey = fakeStorage.setItem.mock.calls[0][0]
      expect(actualKey).toBe('optly_js_sdk_datafile__123')
      // const actualSerializedCacheEntry = fakeStorage.setItem.mock.calls[0][1]
      // const actualEntry = JSON.parse(actualSerializedCacheEntry)
      // expect(actualEntry.datafile).toBe('{"foo":"bar"}')
      // expect(actualEntry.lastModified).toBe('Fri, 08 Mar 2019 18:57:17 GMT')
      // expect(typeof actualEntry.timestamp).toBe('number')
      // expect(actualEntry.timestamp).toBeGreaterThan(0)
    })
  })
})
