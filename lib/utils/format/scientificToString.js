/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const Big = require('big.js');

/**
 * Scientific toString
 *
 * Converts a Scientific Notation to a Float String
 * @param {Big} n
 * @return {string} The fixed amount
 */
function scientificToString(n) {
  if (!(n instanceof Big)) {
    throw new TypeError('Must be a Big.js value!');
  }
  let num = Object.create(n);
  if (num.toString().includes('e')) {
    if (num.e > 0) {
      // TODO: large numbers
    } else {
      // Patch Scientific notation to String
      num = num.toFixed(Math.abs(n.e));
    }
  }
  return (num instanceof Big) ? num.toString() : num;
}

module.exports = scientificToString;
