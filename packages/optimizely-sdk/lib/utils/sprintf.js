const sprintf2 = require('sprintf-js').sprintf;

const sprintf = (message, moduleName, data) => {
  const dataValues = Object.keys(data).map(k => data[k]);
  try {
    return {
      ...data,
      message: sprintf2.apply(sprintf2, [message, moduleName, ...dataValues]),
    }
  } catch (error) {
  }
};

module.exports = sprintf;
