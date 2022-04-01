const toAsaUnits = require('../../utils/units/toAsaUnits.js');
const toBaseUnits = require('../../utils/units/toBaseUnits.js');
const countDecimals = require('../../utils/calc/countDecimals');
/**
 * @typedef {Object} N/D
 * @property {Number} N Numerator
 * @property {Number} D Denominator
 */

/**
 * Convert to Numerator/Denominator
 *
 * Used to handle precision in Algorand and Algodex network.
 *
 * @param {Number} x A number
 * @return {N/D} Numerator/Denominator
 * @memberOf module:order/compile
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

/**
 * With Units
 *
 * Compose the current order with it's converted units
 *
 * @param {Order} o Algodex Order
 * @return {Order} Order with Units
 * @memberOf module:order/compile
 */
function withUnits(o) {
  // Extract Price Parts
  const price = toAsaUnits(o.price, o.asset.decimals);
  const {N, D} = toNumeratorDenominator(price);

  // Compose D/N
  return {
    ...o,
    contract: {
      ...o?.contract,
      price,
      amount: toBaseUnits(o.amount, o.asset.decimals),
      total: toBaseUnits(o.total),
      N, D,
    },
  };
}

module.exports = withUnits;
