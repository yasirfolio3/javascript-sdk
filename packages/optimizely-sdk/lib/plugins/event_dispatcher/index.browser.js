/**
 * Copyright 2016-2017, Optimizely
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
var browserRequest = require('./dispatch_event.browser');
var EventDispatcherModule = require('./event_dispatcher');

module.exports = {
  // For backwards-compat, this module must export a ready-to-use default event dispatcher (an object with an appropriate dispatchEvent method)
  dispatchEvent: browserRequest,

  // For backwards-compat, this module must export a ready-to-use default event dispatcher (an object with an appropriate dispatchEvent method)
  createEventDispatcher: function(logger) {
    return new EventDispatcherModule.EventDispatcher({
      requestFn: browserRequest,
      logger: logger,
    });
  },
};
