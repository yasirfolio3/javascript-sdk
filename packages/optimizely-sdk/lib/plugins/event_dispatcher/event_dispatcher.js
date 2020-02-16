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

 function EventDispatcher(requestFn) {
   this.__requestFn = requestFn;
   this.__inFlightCount = 0;
   this.__reqsCompleteResolvers = [];
 }

EventDispatcher.prototype.dispatchEvent = function(eventObj, callback) {
  this.__inFlightCount++;
  return this.__requestFn(eventObj, function(resp) {
    callback(resp);
    this.__inFlightCount--;
    if (this.__inFlightCount === 0) {
      this.__reqsCompleteResolvers.forEach(function(resolver) {
        resolver({
          success: true,
        });
      });
      this.__reqsCompleteResolvers = [];
    }
  }.bind(this));
};

EventDispatcher.prototype.onRequestsComplete = function() {
  return new Promise(function(resolve) {
    if (this.__inFlightCount === 0) {
      resolve({
        success: true,
      });
      return;
    }
    this.__reqsCompleteResolvers.push(resolve);
  }.bind(this));
};


 module.exports = EventDispatcher;
