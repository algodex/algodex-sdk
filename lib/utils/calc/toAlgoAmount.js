const Big = require('big.js');
const fromAlgoUnits = require('../units/fromAlgoUnits');
/**
 * Calculates the ASA amount of a buy order given the asset price and total
 * ordered amount in base units
 *
 * @param {number} price the asset price in whole unit ALGOs
 * @param {number} totalCost order's total cost in microalgos
 * @return {number} whole unit ASA amount being ordered
 */
function toAlgoAmount(price, totalCost) {
  const wholeUnitCost = new Big(fromAlgoUnits(totalCost));
  const algoDecimals = 6;
  return wholeUnitCost.div(price).round(algoDecimals).toNumber();
}

module.exports = toAlgoAmount;
