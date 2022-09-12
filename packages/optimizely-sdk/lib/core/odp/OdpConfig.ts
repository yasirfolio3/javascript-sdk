export enum OdpConfigState {
    notDetermined,
    integrated,
    notIntegrated
}

export type OdpConfigProps =
    {
        apiHost: string,
        apiKey: string,
        segmentsToCheck: Array<string>
    }

export class OdpConfig {
    _apiHost?: string
    _apiKey?: string
    _segmentsToCheck: Array<string>
    _odpServiceIntegrated: OdpConfigState

    constructor({ apiHost, apiKey, segmentsToCheck }: OdpConfigProps) {
        this._apiHost = apiHost
        this._apiKey = apiKey
        this._segmentsToCheck = segmentsToCheck
        this._odpServiceIntegrated = OdpConfigState.notDetermined
    }
}