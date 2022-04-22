const toAsaUnits = require('../../utils/units/toAsaUnits.js');
const toBaseUnits = require('../../utils/units/toBaseUnits.js');
const toNumeratorDenominator = require('../toNumeratorDenominator');
/**
 * @typedef {Object} N/D
 * @property {Number} N Numerator
 * @property {Number} D Denominator
 */

/**
 * ## [🧮 With Units](#withUnits)
 *
 * Compose the current order with it's converted units
 *
 * @example
 * const res = withUnits(order);
 * console.log(res.contract).
 * // Outputs {N,D,price,amount,total} in BaseUnits
 *
 * @todo: Make all numbers Big numbers
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
