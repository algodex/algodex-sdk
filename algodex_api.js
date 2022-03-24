const fns = require('./lib/functions/base.js');
const algodex = {
  ...fns,
  ...fns.default,
};
const deprecate = require('./lib/functions/deprecate.js');

const deprecatedFns = {};

Object.keys(algodex).forEach((key ) => {
  deprecatedFns[key] = deprecate(algodex[key], {file: module.filename} );
});

module.exports= deprecatedFns;
