/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const Big = require('big.js');

/**
 * Converts limit price or balance in ALGOs to ASA units (for ASAs with
 * different `decimal` properties than ALGO).
 *
 * Formula: asa_units = algo_units * (10 ^ (6 - decimals))
 *
 * @param {Number|String|Big} x a price/balance in ALGOs
 * @param {Number|Big} decimals ASA's `decimals` property
 * @return {Number} converted price/balance
 */
function toAsaUnits(x, decimals) {
  if (typeof x === 'undefined') throw new TypeError('Must have a valid number');
  if (x === null) x = 0;
  const multiplier = new Big(10).pow(6 - decimals);
  return new Big(x).times(multiplier).toNumber();
}

module.exports = toAsaUnits;
