/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const Big = require('big.js');
const scientificToString = require('../format/scientificToString');
/**
 * Count Decimals
 *
 * @param {number} n
 * @return {number|number|number}
 */
const countDecimals = function(n) {
  if (Math.floor(n) === n) return 0;
  return scientificToString(new Big(n))
      .toString()
      .split('.')[1].length || 0;
};

module.exports = countDecimals;
