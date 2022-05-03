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
