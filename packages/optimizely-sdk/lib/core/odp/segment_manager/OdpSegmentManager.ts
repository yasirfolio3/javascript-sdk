import { GraphqlManager } from '../../../../lib/plugins/odp/graphql_manager';
import { LRUCache } from '../lru_cache/LRUCache';
import { OdpConfig } from '../OdpConfig';
import { OptimizelySegmentOption } from '../OptimizelySegmentOption';

export type OdpSegmentManagerProps = {
    odpConfig: OdpConfig
    apiManager: GraphqlManager
}

export class OdpSegmentManager {
    odpConfig: OdpConfig
    // segmentsCache: LRUCache<string, Array<string>>
    apiManager: GraphqlManager

    constructor({
        odpConfig,
        apiManager
    }: OdpSegmentManagerProps) {
        this.odpConfig = odpConfig
        // this.segmentsCache = 
        this.apiManager = apiManager
    }


    private async fetchQualifiedSegments(
        userKey: string,
        userValue: string,
        // options: Array<OptimizelySegmentOption>,
        completionHandler: (segments: Array<string>) => void
    ) {
        const odpApiKey = this.odpConfig._apiKey
        const odpApiHost = this.odpConfig._apiHost

        if (!odpApiKey || !odpApiHost) {
            console.warn('Unable to fetch qualified segments - missing ODP API Key/Host.')
            return
        }

        let segmentsToCheck = this.odpConfig._segmentsToCheck
        if (segmentsToCheck.length <= 0) {
            console.info('No segments to check from ODP Config')
            return
        }

        this.apiManager.fetchSegments(
            odpApiKey,
            odpApiHost,
            userKey,
            userValue,
            segmentsToCheck
        ).then((segments) => {
            completionHandler(segments)
        })
    }
}