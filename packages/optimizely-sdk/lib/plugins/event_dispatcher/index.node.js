/**
 * Copyright 2016-2018, Optimizely
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
var http = require('http');
var https = require('https');
var url = require('url');
var util = require('util');

module.exports = {
  /**
   * Dispatch an HTTP request to the given url and the specified options
   * @param {Object}  eventObj          Event object containing
   * @param {string}  eventObj.url      the url to make the request to
   * @param {Object}  eventObj.params   parameters to pass to the request (i.e. in the POST body)
   * @param {string}  eventObj.httpVerb the HTTP request method type. only POST is supported.
   * @param {function} callback         callback to execute
   * @return {ClientRequest|undefined}          ClientRequest object which made the request, or undefined if no request was made (error)
   */
  dispatchEvent: function(eventObj, callback) {
    // Non-POST requests not supported
    if (eventObj.httpVerb !== 'POST') {
      return;
    }

    var parsedUrl = url.parse(eventObj.url);
    var path = parsedUrl.path;
    if (parsedUrl.query) {
      path += '?' + parsedUrl.query;
    }

    var dataString = JSON.stringify(eventObj.params);

    var requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': dataString.length.toString(),
      }
    };
    // console.log("=== Request Info\n", util.inspect(requestOptions, {showHidden: false, depth: null}))

    var requestCallback = function(response) {
      // console.log("=== Response Info\n", util.inspect(response, { showHidden: false, depth: null }))
      if (response && response.statusCode && response.statusCode >= 200 && response.statusCode < 400) {
        callback(response);
      }
    };

    var req = (parsedUrl.protocol === 'http:' ? http : https).request(requestOptions, requestCallback);
    // Add no-op error listener to prevent this from throwing
    req.on('error', function() {
      console.log("ERROR", arguments)

    });
    req.write(dataString);
    req.end();
    return req;
  }
  /**
   *
"{\"visitors\":[{\"snapshots\":[{\"decisions\":[{\"experiment_id\":\"12893320251\",\"variation_id\":\"12879850470\",\"campaign_id\":\"12889690465\"}],\"events\":[{\"entity_id\":\"12889690465\",\"uuid\":\"f7d70aa2-7a66-4024-9afc-ef5b92903265\",\"key\":\"campaign_activated\",\"timestamp\":1547191046662}]}],\"visitor_id\":\"sb\",\"attributes\":[{\"entity_id\":\"$opt_bot_filtering\",\"type\":\"custom\",\"value\":false,\"key\":\"$opt_bot_filtering\"},{\"entityId\":null,\"type\":\"custom\",\"value\":true,\"key\":\"$opt_enrich_decisions\"}]}],\"account_id\":\"7592617968\",\"project_id\":\"10685243500\",\"header\":{\"clientIp\":\"10.110.254.152\"},\"client_version\":\"3.0.0-rc2\",\"client_name\":\"node-sdk\",\"revision\":\"13\",\"anonymize_ip\":false}"

   */
};
