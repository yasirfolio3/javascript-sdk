// TODO: Most of the functions in here could use some scrutiny.
// Given how these deserializers might be used:
//  What expectations do deserializers have on the input they accept?
//  What validations must they do

import { Response as OptlyResponse, Headers as OptlyHeaders } from './http'

// TODO: Maybe add & use version number
export interface DatafileCacheEntry {
  // TODO: Is there a better name than timestamp, maybe taken from the existing vocabulary like "TTL"?
  timestamp: number
  datafile: string
  lastModified?: string
}

export interface DatafileCacheEntrySerializer<K> {
  serialize(entry: DatafileCacheEntry): Promise<K>
  deserialize(value: K): Promise<DeserializationResult>
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

function deserializeObject(val: any): DeserializationResult {
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

async function deserializeJsonString(val: any): Promise<DeserializationResult> {
  let parseResult: any
  try {
    parseResult = JSON.parse(val)
  } catch (ex) {
    return { type: 'failure', error: ex }
  }
  return deserializeObject(parseResult)
}

function serializeToJsonString(entry: DatafileCacheEntry): Promise<string> {
  return Promise.resolve(JSON.stringify(entry))
}

export const jsonStringSerializer: DatafileCacheEntrySerializer<string> = {
  serialize: serializeToJsonString,
  deserialize: deserializeJsonString,
}

export function getResponseOfCacheEntry(entry: DatafileCacheEntry): OptlyResponse {
  const headers: OptlyHeaders = {}
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
export function getCacheEntryOfResponse(response: OptlyResponse): DatafileCacheEntry {
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

async function serializeToPlainObject(entry: DatafileCacheEntry): Promise<object> {
  return entry
}

async function deserializeFromPlainObject(val: any): Promise<DeserializationResult> {
  return deserializeObject(val)
}

export const plainObjectSerializer: DatafileCacheEntrySerializer<object> = {
  serialize: serializeToPlainObject,
  deserialize: deserializeFromPlainObject,
}

async function serializeToNativeResponse(entry: DatafileCacheEntry): Promise<Response> {
  const headerPairs: string[][] = [
    ['x-timestamp', String(entry.timestamp)],
    ['content-length', String(entry.datafile.length)],
  ]
  if (entry.lastModified) {
    headerPairs.push(['last-modified', entry.lastModified])
  }
  const resp = new Response(entry.datafile, {
    status: 200,
    headers: new Headers(headerPairs),
  })
  return resp
}

async function deserializeFromNativeResponse(
  response: Response,
): Promise<DeserializationResult> {
  if (response.status < 200 || response.status >= 300) {
    return { type: 'failure', error: new Error(`Response status ${response.status}`) }
  }

  const datafile = await response.text()
  if (datafile === '') {
    return { type: 'failure', error: new Error(`Empty response body`) }
  }

  const timestampStr = response.headers.get('x-timestamp')
  const timestamp = timestampStr !== null ? parseInt(timestampStr, 10) : NaN
  if (isNaN(timestamp)) {
    return {
      type: 'failure',
      error: new Error(`Invalid timestamp ${timestampStr}`),
    }
  }

  return {
    type: 'success',
    entry: {
      datafile,
      timestamp,
      lastModified:
        response.headers.get('last-modified') || response.headers.get('Last-Modified') || undefined,
    },
  }
}

export const nativeResponseSerializer: DatafileCacheEntrySerializer<Response> = {
  serialize: serializeToNativeResponse,
  deserialize: deserializeFromNativeResponse,
}
