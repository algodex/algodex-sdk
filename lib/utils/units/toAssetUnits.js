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
function toAssetUnits(x, decimals) {
  if (typeof x === 'undefined') throw new TypeError('Must have a valid number');
  if (x === null) x = 0;
  const multiplier = new Big(10).pow(6 - decimals);
  return new Big(x).times(multiplier).toNumber();
}

module.exports = toAssetUnits;
