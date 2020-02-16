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

var chai = require('chai');
var sinon = require('sinon');
var EventDispatcher = require('./event_dispatcher');

var assert = chai.assert;

describe('lib/plugins/event_dispatcher', function() {
  describe('dispatchEvent', function() {
    it('calls requestFn, passing the event object as the first argument', function() {
      var reqFn = sinon.spy();
      var dispatcher = new EventDispatcher(reqFn);
      var evt1 = {};
      var evt2 = {};
      dispatcher.dispatchEvent(evt1, function() {});
      dispatcher.dispatchEvent(evt2, function() {});
      sinon.assert.calledTwice(reqFn);
      sinon.assert.calledWith(reqFn, evt1);
      sinon.assert.calledWith(reqFn, evt2);
    });

    it('calls requestFn, passing a callback as the second argument, and should call its callback argument after requestFn calls its callback', function() {
      var reqFn = sinon.spy();
      var callback = sinon.spy();
      var dispatcher = new EventDispatcher(reqFn);
      dispatcher.dispatchEvent({}, callback);
      // dispatchEvent callback should not be called yet - requestFn hasn't called back yet
      sinon.assert.notCalled(callback);
      // Should have passed a function as 2nd arg when calling reqFn
      var reqFnCallback = reqFn.getCalls()[0].args[1]
      assert.isFunction(reqFnCallback);
      var response = {};
      reqFnCallback(response);
      sinon.assert.calledOnce(callback);
      sinon.assert.calledWithExactly(callback, response);
    });
  });

  describe('onRequestsComplete', function() {
    it('should return an immediately-fulfilled promise if no requests are in flight', function() {
      var dispatcher = new EventDispatcher(function() {});
      return dispatcher.onRequestsComplete().then(function(result) {
        assert.isTrue(result.success);
      });
    });

    it('should return a promise that fulfills after in-flight requests are complete', function() {
      var reqFn = sinon.spy();
      var dispatcher = new EventDispatcher(reqFn);

      dispatcher.dispatchEvent({}, function() {});
      dispatcher.dispatchEvent({}, function() {});

      var onComplete = dispatcher.onRequestsComplete();

      var firstReqFnCallback = reqFn.getCalls()[0].args[1];
      firstReqFnCallback({});
      var secondReqFnCallback = reqFn.getCalls()[1].args[1];
      secondReqFnCallback({});

      return onComplete.then(function(result) {
        assert.isTrue(result.success);
      });
    });
  });
});
