const Big = require('big.js');
const scientificToString = require('../format/scientificToString');
/**
 * Count Decimals
 *
 * @param {number} n
 * @return {number|number|number}
 */
const countDecimals = function(n) {
  if (Math.floor(n) === n) return 0;
  return scientificToString(new Big(n))
      .toString()
      .split('.')[1].length || 0;
};

module.exports = countDecimals;
