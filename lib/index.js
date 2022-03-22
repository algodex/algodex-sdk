const deprecate = require('./functions/deprecate');
const fns = require('./functions');

const DEPRECATED_STATICS = {
  ...fns,
};

module.exports = require('./AlgodexApi');

/**
 * @param {string} key Key to deprecate
 * @private
 */
function addDeprecate(key) {
  module.exports[key] = deprecate(DEPRECATED_STATICS[key]);
}

// Add deprecated functions as statics
Object.keys(DEPRECATED_STATICS).forEach(addDeprecate);

if (process.env.NODE_ENV === 'test') {
  module.exports._addDeprecate = addDeprecate;
}
