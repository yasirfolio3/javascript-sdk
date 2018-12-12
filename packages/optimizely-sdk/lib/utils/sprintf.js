const sprintf2 = require('sprintf-js').sprintf;

const sprintf = (message, moduleName, data) => {
  if (typeof data === 'string') return;
  const dataValues = Object.keys(data).map(k => data[k]);
  return {
    ...data,
    message: sprintf2.apply(sprintf2, [message, moduleName, ...dataValues]),
  }
};

module.exports = sprintf;
