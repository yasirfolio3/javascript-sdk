import { OdpEvent } from './../plugins/odp/odp_event';
import { REQUEST_TIMEOUT_MS } from './../../../datafile-manager/src/config';
import { RestApiManager } from './../plugins/odp/rest_api_manager';
import { LogHandler } from './../../../logging/src/models';
import { OptimizelySegmentOption } from './../core/odp/OptimizelySegmentOption';
/****************************************************************************
 * Copyright 2020-2022, Optimizely, Inc. and contributors                   *
 *                                                                          *
 * Licensed under the Apache License, Version 2.0 (the "License");          *
 * you may not use this file except in compliance with the License.         *
 * You may obtain a copy of the License at                                  *
 *                                                                          *
 *    http://www.apache.org/licenses/LICENSE-2.0                            *
 *                                                                          *
 * Unless required by applicable law or agreed to in writing, software      *
 * distributed under the License is distributed on an "AS IS" BASIS,        *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. *
 * See the License for the specific language governing permissions and      *
 * limitations under the License.                                           *
 ***************************************************************************/
import Optimizely from '../../lib/optimizely';
import {
  EventTags,
  OptimizelyDecideOption,
  OptimizelyDecision,
  OptimizelyDecisionContext,
  OptimizelyForcedDecision,
  UserAttributes,
} from '../../lib/shared_types';
import { CONTROL_ATTRIBUTES } from '../utils/enums';
import { GraphqlManager } from '../../lib/plugins/odp/graphql_manager';
import BrowserAsyncStorageCache from '../../lib/plugins/key_value_cache/browserAsyncStorageCache';
import { VuidManager } from '../../lib/plugins/vuid_manager';

export default class OptimizelyUserContext {
  private optimizely: Optimizely;
  private userId: string;
  private attributes: UserAttributes;
  private forcedDecisionsMap: { [key: string]: { [key: string]: OptimizelyForcedDecision } };
  private _qualifiedSegments: string[] = [];
  private cacheInstance = new BrowserAsyncStorageCache();

  constructor({
    optimizely,
    userId,
    attributes,
  }: {
    optimizely: Optimizely,
    userId?: string,
    attributes?: UserAttributes,
  }) {
    this.optimizely = optimizely;
    this.userId = userId || '';
    this.attributes = { ...attributes } ?? {};
    this.forcedDecisionsMap = {};
  }

  /**
   * Sets an attribute for a given key.
   * @param     {string}                     key         An attribute key
   * @param     {any}                        value       An attribute value
   */
  setAttribute(key: string, value: unknown): void {
    this.attributes[key] = value;
  }

  getUserId(): string {
    return this.userId;
  }

  async getUserIdOdp(): Promise<string> {
    const vuidManager = await VuidManager.instance(this.cacheInstance)

    const userId = (this.getUserId() !== '')
      ? this.getUserId()
      : vuidManager.vuid;

    return userId // Return VUID/FS_UID Type here too?
  }

  getAttributes(): UserAttributes {
    return { ...this.attributes };
  }

  getOptimizely(): Optimizely {
    return this.optimizely;
  }

  public get qualifiedSegments(): string[] {
    return this._qualifiedSegments;
  }

  public set qualifiedSegments(qualifiedSegments: string[]) {
    this._qualifiedSegments = [...qualifiedSegments];
  }

  /**
   * Returns a decision result for a given flag key and a user context, which contains all data required to deliver the flag.
   * If the SDK finds an error, it will return a decision with null for variationKey. The decision will include an error message in reasons.
   * @param     {string}                     key         A flag key for which a decision will be made.
   * @param     {OptimizelyDecideOption}     options     An array of options for decision-making.
   * @return    {OptimizelyDecision}                     A decision result.
   */
  decide(
    key: string,
    options: OptimizelyDecideOption[] = []
  ): OptimizelyDecision {
    return this.optimizely.decide(this.cloneUserContext(), key, options);
  }

  /**
   * Returns an object of decision results for multiple flag keys and a user context.
   * If the SDK finds an error for a key, the response will include a decision for the key showing reasons for the error.
   * The SDK will always return key-mapped decisions. When it cannot process requests, it will return an empty map after logging the errors.
   * @param     {string[]}                   keys        An array of flag keys for which decisions will be made.
   * @param     {OptimizelyDecideOption[]}   options     An array of options for decision-making.
   * @return    {[key: string]: OptimizelyDecision}      An object of decision results mapped by flag keys.
   */
  decideForKeys(
    keys: string[],
    options: OptimizelyDecideOption[] = [],
  ): { [key: string]: OptimizelyDecision } {

    return this.optimizely.decideForKeys(this.cloneUserContext(), keys, options);
  }

  /**
   * Returns an object of decision results for all active flag keys.
   * @param     {OptimizelyDecideOption[]}   options     An array of options for decision-making.
   * @return    {[key: string]: OptimizelyDecision}      An object of all decision results mapped by flag keys.
   */
  decideAll(
    options: OptimizelyDecideOption[] = []
  ): { [key: string]: OptimizelyDecision } {

    return this.optimizely.decideAll(this.cloneUserContext(), options);
  }

  /**
   * Tracks an event.
   * @param     {string}                     eventName The event name.
   * @param     {EventTags}                  eventTags An optional map of event tag names to event tag values.
   */
  trackEvent(eventName: string, eventTags?: EventTags): void {
    this.optimizely.track(eventName, this.userId, this.attributes, eventTags);
  }

  /**
   * Sets the forced decision for specified optimizely decision context.
   * @param     {OptimizelyDecisionContext}   context      OptimizelyDecisionContext containing flagKey and optional ruleKey.
   * @param     {OptimizelyForcedDecision}    decision     OptimizelyForcedDecision containing forced variation key.
   * @return    {boolean}                     true if the forced decision has been set successfully.
   */
  setForcedDecision(context: OptimizelyDecisionContext, decision: OptimizelyForcedDecision): boolean {
    const flagKey = context.flagKey;

    const ruleKey = context.ruleKey ?? CONTROL_ATTRIBUTES.FORCED_DECISION_NULL_RULE_KEY;
    const variationKey = decision.variationKey;
    const forcedDecision = { variationKey };

    if (!this.forcedDecisionsMap[flagKey]) {
      this.forcedDecisionsMap[flagKey] = {};
    }
    this.forcedDecisionsMap[flagKey][ruleKey] = forcedDecision;

    return true;
  }

  /**
   * Returns the forced decision for specified optimizely decision context.
   * @param     {OptimizelyDecisionContext}  context  OptimizelyDecisionContext containing flagKey and optional ruleKey.
   * @return    {OptimizelyForcedDecision|null}       OptimizelyForcedDecision for specified context if exists or null.
   */
  getForcedDecision(context: OptimizelyDecisionContext): OptimizelyForcedDecision | null {
    return this.findForcedDecision(context);
  }

  /**
   * Removes the forced decision for specified optimizely decision context.
   * @param     {OptimizelyDecisionContext}  context  OptimizelyDecisionContext containing flagKey and optional ruleKey.
   * @return    {boolean}                    true if the forced decision has been removed successfully
   */
  removeForcedDecision(context: OptimizelyDecisionContext): boolean {
    const ruleKey = context.ruleKey ?? CONTROL_ATTRIBUTES.FORCED_DECISION_NULL_RULE_KEY;
    const flagKey = context.flagKey;

    let isForcedDecisionRemoved = false;

    if (this.forcedDecisionsMap.hasOwnProperty(flagKey)) {
      const forcedDecisionByRuleKey = this.forcedDecisionsMap[flagKey];
      if (forcedDecisionByRuleKey.hasOwnProperty(ruleKey)) {
        delete this.forcedDecisionsMap[flagKey][ruleKey];
        isForcedDecisionRemoved = true;
      }
      if (Object.keys(this.forcedDecisionsMap[flagKey]).length === 0) {
        delete this.forcedDecisionsMap[flagKey];
      }
    }

    return isForcedDecisionRemoved;
  }

  /**
   * Removes all forced decisions bound to this user context.
   * @return    {boolean}                    true if the forced decision has been removed successfully
   */
  removeAllForcedDecisions(): boolean {
    this.forcedDecisionsMap = {};
    return true;
  }

  /**
   * Finds a forced decision in forcedDecisionsMap for provided optimizely decision context.
   * @param     {OptimizelyDecisionContext}     context  OptimizelyDecisionContext containing flagKey and optional ruleKey.
   * @return    {OptimizelyForcedDecision|null}          OptimizelyForcedDecision for specified context if exists or null.
   */
  private findForcedDecision(context: OptimizelyDecisionContext): OptimizelyForcedDecision | null {
    let variationKey;
    const validRuleKey = context.ruleKey ?? CONTROL_ATTRIBUTES.FORCED_DECISION_NULL_RULE_KEY;
    const flagKey = context.flagKey;

    if (this.forcedDecisionsMap.hasOwnProperty(context.flagKey)) {
      const forcedDecisionByRuleKey = this.forcedDecisionsMap[flagKey];
      if (forcedDecisionByRuleKey.hasOwnProperty(validRuleKey)) {
        variationKey = forcedDecisionByRuleKey[validRuleKey].variationKey;
        return { variationKey };
      }
    }

    return null;
  }

  public isQualifiedFor(segment: string): boolean {
    return this._qualifiedSegments.indexOf(segment) > -1;
  }

  public async fetchQualifiedSegments(options: Array<OptimizelySegmentOption> = []): Promise<void> {
    const userIdOdp = await this.getUserIdOdp()

    const apiManager = new GraphqlManager({
      handleError: (exception: Error) => {
        console.error(exception)
      }
    }, {
      log: (level, message) => {
        console.log(level, message)
      }
    })

    console.info(`Fetching segments using params: {
      key: ${this.optimizely.odpInformation.key},
      endpoint: ${this.optimizely.odpInformation.host}/v3/graphql,
      userKey: 'fs_user_id',
      userValue: ${userIdOdp},
      segments: ${Array.from(this.optimizely.odpInformation.segments)}
    }`)

    let updatedSegments = await apiManager.fetchSegments(
      this.optimizely.odpInformation.key,
      this.optimizely.odpInformation.host + '/v3/graphql',
      'fs_user_id',
      userIdOdp,
      Array.from(this.optimizely.odpInformation.segments)
    )

    this._qualifiedSegments = updatedSegments
  }

  private cloneUserContext(): OptimizelyUserContext {
    const userContext = new OptimizelyUserContext({
      optimizely: this.getOptimizely(),
      userId: this.getUserId(),
      attributes: this.getAttributes(),
    });

    if (Object.keys(this.forcedDecisionsMap).length > 0) {
      userContext.forcedDecisionsMap = { ...this.forcedDecisionsMap };
    }

    if (this._qualifiedSegments) {
      userContext._qualifiedSegments = [...this._qualifiedSegments];
    }

    return userContext;
  }

  // public async sendOdpEvents(events: OdpEvent[]) {
  //   if (!events || events.length === 0) {
  //     console.log('Error: Need to send an array of odp events')

  //     console.log(`
  //     Example:
  //     [
  //       new OdpEvent('t1', 'a1',
  //         new Map([['id-key-1', 'id-value-1']]),
  //         new Map(Object.entries({
  //           key11: 'value-1',
  //           key12: true,
  //           key13: 3.5,
  //           key14: null,
  //         }))),
  //       new OdpEvent('t2', 'a2',
  //         new Map([['id-key-2', 'id-value-2']]),
  //         new Map(Object.entries({
  //           key2: 'value-2',
  //         }))),
  //     ];`)
  //   }

  //   try {
  //     const vuid = await this.getUserIdOdp()
  //     console.log('sendOdpEvent vuid: ' + vuid)


  //     const apiManager = new RestApiManager({
  //       log: (level, message) => {
  //         console.log(level, message)
  //       }
  //     })

  //     console.log('Sending ODP Event with following params:')
  //     console.log(
  //       `Key: ${this.optimizely.odpInformation.key}`,
  //       `Host: ${this.optimizely.odpInformation.host}`,
  //       `Events: ${JSON.stringify(events)}`
  //     )

  //     const sendEventSuccess = await apiManager.sendEvents(
  //       this.optimizely.odpInformation.key,
  //       this.optimizely.odpInformation.host,
  //       events,
  //     )

  //     return sendEventSuccess
  //   } catch (e: unknown) {
  //     console.error('Unable to send ODP Event')
  //     return false
  //   }
  // }

  // key: ${this.optimizely.odpInformation.key},
  // endpoint: ${this.optimizely.odpInformation.host}/v3/graphql,
  // userKey: 'fs_user_id',
  // userValue: ${userIdOdp},
  // segments: ${Array.from(this.optimizely.odpInformation.segments)}

}
