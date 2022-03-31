/**
 *
 * @param n
 * @return {number|number|number}
 */
const countDecimals = function(n) {
  if (Math.floor(n) === n) return 0;
  return n.toString().split('.')[1].length || 0;
};

module.exports = countDecimals;
