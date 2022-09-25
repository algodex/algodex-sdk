/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const countDecimals = require('../../utils/calc/countDecimals');

/**
 * Convert to Numerator/Denominator
 *
 * Used to handle precision in Algorand and Algodex network.
 *
 * @param {Number} x A number
 * @return {Object<{N: number, D: number}>} Numerator/Denominator
 * @memberOf module:order/compile.withUnits
 */
function toNumeratorDenominator(x) {
  const origDecCount = countDecimals(x);
  const d = 10**origDecCount * x;
  const n = 10**origDecCount;

  return {
    N: Math.round(n),
    D: Math.round(d),
  };
}

module.exports = toNumeratorDenominator;
