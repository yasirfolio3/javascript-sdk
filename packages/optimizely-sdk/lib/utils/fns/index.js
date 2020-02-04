/**
 * Copyright 2017, 2019, Optimizely
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
import uuid from 'uuid';
var MAX_NUMBER_LIMIT = Math.pow(2, 53);

var _isFinite = function(value) {
  return typeof value == 'number' && isFinite(value);
}

export default {
  currentTimestamp: function() {
    return Math.round(new Date().getTime());
  },
  isFinite: function(number) {
    return _isFinite(number) && Math.abs(number) <= MAX_NUMBER_LIMIT;
  },
  keyBy: function(arr, key) {
    const byKey = {};
    arr.forEach(val => {
      byKey[val[key]] = val;
    });
    return val;

  },
  uuid: function() {
    return uuid.v4();
  },
  isNumber: require('lodash-es/isNumber'),
};
