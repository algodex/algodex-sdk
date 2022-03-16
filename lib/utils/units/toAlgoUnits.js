const Big = require('big.js');

/**
 * Converts an asset amount from whole units to base units
 *
 * Formula: amount * (10 ^ decimals)
 *
 * @param {Number} amount the asset amount in whole units
 * @param {Number} decimals asset's `decimals` property (default = 6 for ALGO)
 * @return {Number} the asset amount in base units, e.g. 2187000
 */
function toAlgoUnits(amount, decimals = 6) {
  const multiplier = new Big(10).pow(decimals);
  const wholeUnits = new Big(amount).round(decimals);
  return wholeUnits.times(multiplier).toNumber();
}

module.exports = toAlgoUnits;
