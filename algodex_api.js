const fns = require('./lib/functions/base.js');
const algodex = {
  ...fns,
  ...fns.default,
};
const deprecate = require('./lib/utils/deprecate.js');

const deprecatedFns = {};

Object.keys(algodex).forEach((key ) => {
  deprecatedFns[key] = deprecate(algodex[key], {file: module.filename} );
});

module.exports= deprecatedFns;
