var sprintf2 = require('sprintf-js').sprintf;

var sprintf = function(message, moduleName, data) {
  var dataValues = Object.keys(data).map(function(k) { return data[k]; });
  try {
    return Object.assign({}, data, {
      message: sprintf2.apply(sprintf2, [message, moduleName].concat(dataValues)),
    });
  } catch (error) {}
};

module.exports = sprintf;
