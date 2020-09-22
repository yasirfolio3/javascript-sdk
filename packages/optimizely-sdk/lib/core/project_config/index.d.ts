import { getExperimentId } from "."
/**
 * Copyright 2020, Optimizely
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

declare module '@optimizely/optimizely-sdk/lib/core/project_config' {
  export interface ProjectConfig {}
  export function isRunning(configObj: ProjectConfig, experimentKey: string): boolean
  export function getVariationIdFromExperimentAndVariationKey(configObj: ProjectConfig, experimentKey: string, variationKey: string) : string
  export function getExperimentId(configObj: ProjectConfig, experimentKey: string): string
  export function eventWithKeyExists(configObj: ProjectConfig, eventKey: string): boolean
  export function isFeatureExperiment(configObj: ProjectConfig, experimentId: string): boolean
  export function getFeatureFromKey(configObj: ProjectConfig, featureKey: string, logger: any): string
  export function getVariableForFeature(configObj: ProjectConfig, featureKey: string, logger: any): string
  export function getFeatureFromKey(configObj: ProjectConfig, featureKey: string, variableKey: string, logger: any): string
  export function getTypeCastValue(variableValue: string, type: string, logger: any): any;
  export function getFeatureFromKey(variableValue: string, type: string, logger: any): any;
  
  // var variationId = projectConfig.getVariationIdFromExperimentAndVariationKey(configObj, experimentKey, variationKey);
  // var experimentId = projectConfig.getExperimentId(configObj, experimentKey);

  //  (!projectConfig.eventWithKeyExists(configObj, eventKey))
  // var decisionNotificationType = projectConfig.isFeatureExperiment(configObj, experiment.id)
  // var feature = projectConfig.getFeatureFromKey(configObj, featureKey, this.logger);
  // var featureFlag = projectConfig.getFeatureFromKey(configObj, featureKey, this.logger);
  // var variable = projectConfig.getVariableForFeature(configObj, featureKey, variableKey, this.logger);
  // var variable = projectConfig.getVariableForFeature(configObj, featureKey, variableKey, this.logger);
  // return projectConfig.getTypeCastValue(variableValue, variable.type, this.logger);
  // var featureFlag = projectConfig.getFeatureFromKey(configObj, featureKey, this.logger);
}
