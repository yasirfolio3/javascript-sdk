// Instantiate and export optimizely from another module
import optimizelyClient from './optimizely';

/**
 * Scenario: Targeted rollout of a redesigned version of the projects dashboard.
 * The new design consumes data from a new version of an API endpoint.
 * We represent the API version as a string feature variable in Optimizely.
 *
 * projectsDashboardConfig returns an object describing the data source
 * configuration for the argument user when they visit the projects dashboard.
 *
 * @param {optimizely.Client} optimizelyClient
 * @param {Object} user
 * @param {String} user.id
 * @param {Object} user.attributes
 */
export function projectsDashboardConfig(user) {
  let apiVersion = optimizelyClient.getFeatureVariable(
    'project_types_redesign',
    'apiVersion',
    user.id,
    user.attributes,
  );
  return {
    endpoint: API_DATA_SOURCE_ENDPOINTS[apiVersion]
  }
}
