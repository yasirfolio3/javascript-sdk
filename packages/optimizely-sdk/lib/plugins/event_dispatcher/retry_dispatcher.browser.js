var logging = require('@optimizely/js-sdk-logging');
var fns = require('../../utils/fns');
var LS_KEY = 'optly_fs_event_queue';
var eventDispatcher = require('./index.browser');

var logger = logging.getLogger('EventDispatcher');

function RetryEventDispatcher() {}

RetryEventDispatcher.prototype.dispatchUnsentEvents = function() {
  try {
    var queue = this.__getLSQueue();
    var events = fns.values(queue);
    if (events.length > 0) {
      logger.info('Retrying unsent events, count=%s', events.length)
    }
    events.forEach(
      function(item) {
        this.__doDispatch(item.uuid, item.data);
      }.bind(this)
    );
  } catch (e) {
    logger.error('Error retrying event dispatching: "%s", clearing queue', e.message, e);
  }
};

RetryEventDispatcher.prototype.dispatchEvent = function(data, cb) {
  var uuid = fns.uuid();
  this.__addEntry(uuid, data);
  this.__doDispatch(uuid, data, cb);
};

RetryEventDispatcher.prototype.__doDispatch = function(uuid, data, cb) {
  eventDispatcher.dispatchEvent(
    data,
    function() {
      this.__completeEntry(uuid);
      if (cb && typeof cb === 'function') {
        cb();
      }
    }.bind(this)
  );
};

RetryEventDispatcher.prototype.__getLSQueue = function() {
  var item;
  try {
    item = JSON.parse(window.localStorage.getItem(LS_KEY));
  } catch (e) {
    logger.error('Error getting event retry queue from LocalStorage: "%s"', e.message, e);
  }
  return item || {};
};

RetryEventDispatcher.prototype.__addEntry = function(uuid, data) {
  try {
    var queue = this.__getLSQueue();
    queue[uuid] = {
      uuid: uuid,
      status: 'unsent',
      data: data,
    };
    window.localStorage.setItem(LS_KEY, JSON.stringify(queue));
  } catch (e) {
    logger.error('Error adding entry to LocalStorage: "%s"', e.message, e);
  }
};

RetryEventDispatcher.prototype.__completeEntry = function(uuid) {
  try {
    var queue = this.__getLSQueue();
    delete queue[uuid];
    window.localStorage.setItem(LS_KEY, JSON.stringify(queue));
  } catch (e) {
    logger.error('Error marking retry entry "complete": "%s"', e.message, e);
  }
};

module.exports = new RetryEventDispatcher();
