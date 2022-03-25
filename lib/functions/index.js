const deprecate = require('../utils/deprecate');
// import someFunction from './someFunction'


/**
 * Modules exports
 * @type {{}}
 */
const deprecated = {

};

/**
 * Export of deprecated functions
 */
module.exports = Object.keys(deprecated).reduce((prev, key)=>{
  prev[key] = deprecate(deprecated[key], {file: module.filename});
}, {});
