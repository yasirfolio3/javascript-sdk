// TODO: Circular import problem?
import { DeserializationResult } from './datafileCacheSerializer'
import { Response, Headers } from './http'

// TODO: Add & use version number
// TODO: Change to string
export interface DatafileCacheEntry {
  timestamp: number
  datafile: object
  lastModified?: string
}

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
  if (typeof maybeDatafile !== 'object' || maybeDatafile === null) {
    return { type: 'failure', error: new Error('Invalid datafile') }
  }
  const datafile: object = maybeDatafile

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
    // TODO: Stringify and then parse again - bad
    body: JSON.stringify(entry.datafile),
    headers,
  }
}

export function getCacheEntryOfResponse(response: Response): DatafileCacheEntry {
  const entry: DatafileCacheEntry = {
    timestamp: Date.now(),
    // TODO: MAke type of datafile string in DatafileCacheEntry. Makes it easier, fixes other TODO above too.
    datafile: JSON.parse(response.body),
  }
  const lastModified =
    response.headers['last-modified'] || response.headers['Last-Modified']
  if (lastModified) {
    entry.lastModified = lastModified
  }
  return entry
}
