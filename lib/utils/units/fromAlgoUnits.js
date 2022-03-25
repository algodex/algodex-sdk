const Big = require('big.js');

/**
 * Converts an asset amount from base units to whole units
 *
 * Formula: amount / (10 ^ decimals)
 *
 * @param {Number} amount the asset amount in base units
 * @param {Number} decimals asset's `decimals` property (default = 6 for ALGO)
 * @return {Number} the asset amount in whole units, e.g. 2.187
 * @memberOf Big.prototype
 */
function fromAlgoUnits(amount, decimals = 6) {
  const divisor = new Big(10).pow(decimals);
  const baseUnits = new Big(amount).round(decimals);
  return baseUnits.div(divisor).toNumber();
}

module.exports = fromAlgoUnits;
