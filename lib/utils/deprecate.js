/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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
