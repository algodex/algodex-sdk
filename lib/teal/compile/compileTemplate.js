/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


/**
 * ## 🏗 [Compile Template](#compileTemplate)
 * Compiles a Teal Template
 *
 * @param {Object} data
 * @param {String} template
 * @return {string}
 * @memberOf module:teal/compile
 */
function compileTemplate(data, template) {
  if (typeof data === 'undefined' || typeof data !== 'object') {
    throw new TypeError('Data must be an object!');
  }
  if (typeof template !== 'string') {
    throw new TypeError('Template must be a string!');
  }
  // Clone the template
  let res = `${template}`;
  // Apply data keys
  Object.keys(data).forEach((key)=>{
    res = res.split(`<${key}>`).join(data[key]);
  });
  // Return result
  return res;
}

module.exports = compileTemplate;
