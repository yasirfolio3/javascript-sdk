import { Response, Headers } from './http'

// TODO: Add & use version number
export interface DatafileCacheEntry {
  timestamp: number
  datafile: string
  lastModified?: string
}

export interface DatafileCacheEntrySerializer<K> {
  serialize(entry: DatafileCacheEntry): K
  deserialize(value: K): DeserializationResult
}

export interface DeserializationFailure {
  type: 'failure'
  error: Error
}

export interface DeserializationSuccess {
  type: 'success'
  entry: DatafileCacheEntry
}

export type DeserializationResult = DeserializationFailure | DeserializationSuccess

export function deserializeObject(val: any): DeserializationResult {
  if (typeof val !== 'object' || val === null) {
    return { type: 'failure', error: new Error('Not an object') }
  }

  const obj: { [index: string]: any } = val

  const maybeTimestamp: any = obj.timestamp
  if (typeof maybeTimestamp !== 'number') {
    return { type: 'failure', error: new Error('Invalid timestamp') }
  }
  const timestamp: number = maybeTimestamp

  const maybeDatafile: any = obj.datafile
  if (typeof maybeDatafile !== 'string') {
    return { type: 'failure', error: new Error('Invalid datafile') }
  }
  const datafile: string = maybeDatafile

  const maybeLastModified: any = obj.lastModified
  let lastModified: string | undefined = undefined
  if (typeof maybeLastModified === 'string') {
    lastModified = maybeLastModified
  }

  return {
    type: 'success',
    entry: {
      timestamp,
      datafile,
      lastModified,
    },
  }
}

export function deserializeJsonString(val: any): DeserializationResult {
  let parseResult: any
  try {
    parseResult = JSON.parse(val)
  } catch (ex) {
    return { type: 'failure', error: ex }
  }
  return deserializeObject(parseResult)
}

export function serializeToJsonString(entry: DatafileCacheEntry): string {
  return JSON.stringify(entry)
}

export function getResponseOfCacheEntry(entry: DatafileCacheEntry): Response {
  const headers: Headers = {}
  if (entry.lastModified) {
    headers['last-modified'] = entry.lastModified
  }
  return {
    statusCode: 200,
    body: entry.datafile,
    headers,
  }
}

// TODO: Should use DatafileResponse type that is known to be valid & cacheable?
export function getCacheEntryOfResponse(response: Response): DatafileCacheEntry {
  const entry: DatafileCacheEntry = {
    timestamp: Date.now(),
    datafile: response.body,
  }
  const lastModified =
    response.headers['last-modified'] || response.headers['Last-Modified']
  if (lastModified) {
    entry.lastModified = lastModified
  }
  return entry
}
