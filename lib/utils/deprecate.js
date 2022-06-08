const logger = require('../logger');
/**
 * Deprecate Function
 *
 * Used to warn the user the function is deprecated. Optionally exit early
 *
 * @param {function} fn The function to deprecate
 * @param {object} [options] Options for deprecate
 * @param {boolean} [options.throws] Flag for throwing error
 * @param {string} [options.file] File that is deprecating the method
 * @return {function} Returns the function with the message
 * @memberOf utils
 * @package
 */
function deprecate(
    fn,
    {
      context,
      file='@algodex/algodex-sdk',
      dest='@algodex/algodex-sdk/lib/functions/*',
      throws = false,
    } = {},
) {
  // Extract Message
  const fnName = fn.name === '' ? 'unnamedFunction' : fn.name;
  const message = `Method: ${fnName} is @deprecated from ${file}!!! \n`+
    `import {${fnName}} from '${dest}'`;

  // Handle Deprecation
  if (throws) throw new Error(message);
  else logger.warn(message);

  // Rebind Context
  if (typeof context !== 'undefined') fn = fn.bind(context);

  // Return to caller
  return fn;
}

module.exports = deprecate;
