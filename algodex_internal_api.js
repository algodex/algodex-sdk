const fns= require('./lib/functions/base.js');
const deprecate = require('./lib/functions/deprecate.js');
const deprecatedFns = {};

Object.keys(fns).forEach((key ) => {
  deprecatedFns[key] = deprecate(fns[key], {file: 'algodex_internal_api.js'} );
});

module.exports= deprecatedFns;
