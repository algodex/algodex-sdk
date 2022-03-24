const fns= require('./lib/functions/base.js');
const internal = {
  ...fns,
  ...fns.default,
};
const deprecate = require('./lib/functions/deprecate.js');
const deprecatedFns = {};

Object.keys(internal).forEach((key ) => {
  deprecatedFns[key] = deprecate(internal[key], {file: module.filename} );
});

module.exports= deprecatedFns;
