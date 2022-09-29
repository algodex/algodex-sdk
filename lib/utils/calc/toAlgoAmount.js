/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const Big = require('big.js');
const fromBaseUnits = require('../units/fromBaseUnits');

/**
 * Calculates the ASA amount of a buy order given the asset price and total
 * ordered amount in base units
 *
 * @param {number} price the asset price in whole unit ALGOs
 * @param {number} totalCost order's total cost in microalgos
 * @return {number} whole unit ASA amount being ordered
 */
function toAlgoAmount(price, totalCost) {
  const wholeUnitCost = new Big(fromBaseUnits(totalCost));
  const algoDecimals = 6;
  return wholeUnitCost.div(price).round(algoDecimals).toNumber();
}

module.exports = toAlgoAmount;
