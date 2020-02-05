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
var dispatchEvent = require('./dispatch_event.node');
var EventDispatcherModule = require('./event_dispatcher');

module.exports = {
  // For backwards-compat, this module must export a ready-to-use default event dispatcher (an object with an appropriate dispatchEvent method)
  dispatchEvent: dispatchEvent,

  // We also export a factory for a stateful event dispatcher instance that tracks in-flight requests and exposes a close method
  createEventDispatcher: function(logger) {
    return new EventDispatcherModule.EventDispatcher({
      requestFn: dispatchEvent,
      logger: logger,
    });
  },
};
